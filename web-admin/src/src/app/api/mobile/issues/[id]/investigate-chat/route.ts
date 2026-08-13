import { getPrisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/require-mobile-auth";
import { NextResponse } from "next/server";
import { callMultiEngineAi, AiMessage } from "@/lib/ai-engine";

const INVESTIGATOR_ROLES = ["QA", "LINE_LEADER", "TECHNOLOGY", "DEPARTMENT_HEAD", "DIRECTOR", "ADMIN"];
const MAX_QUESTIONS = 5;

type ChatTurn = { role: "user" | "model"; text: string };

type Conclusion = {
  type: "conclusion";
  rootCause: string;
  man: string;
  machine: string;
  material: string;
  method: string;
  measurement: string;
  environment: string;
};
type Question = { type: "question"; text: string };

function buildSystemInstruction(
  description: string,
  failureCategory: string | null,
) {
  return `Bạn là chuyên gia phân tích nguyên nhân gốc rễ 5 Whys trong nhà máy TBS Group.
Vấn đề: "${description}"${failureCategory ? ` (lỗi: ${failureCategory})` : ""}.

Nhiệm vụ:
- Hỏi ĐÚNG 1 câu hỏi "Tại sao" ngắn gọn, sâu sắc dựa trên câu trả lời trước đó.
- BẮT BUỘC hỏi đủ ${MAX_QUESTIONS} câu trước khi chốt nguyên nhân.
- Khi đủ ${MAX_QUESTIONS} câu: tổng hợp 5M+1E (Man, Machine, Material, Method, Measurement, Environment).
Trả về CHỈ JSON:
- Hỏi tiếp: {"type":"question","text":"<câu hỏi>"}
- Đã chốt: {"type":"conclusion","rootCause":"<nguyên nhân gốc>","man":"...","machine":"...","material":"...","method":"...","measurement":"...","environment":"..."}`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { payload, response } = requireMobileAuth(req);
  if (response) return response;
  const { id } = await params;
  const prisma = await getPrisma();

  if (!INVESTIGATOR_ROLES.includes(payload.role)) {
    return NextResponse.json(
      { error: "Chỉ QA/Trưởng line/Công nghệ mới được điều tra" },
      { status: 403 },
    );
  }

  const issue = await prisma.qualityIssue.findUnique({
    where: { id },
    include: { failureCategory: true },
  });
  if (!issue)
    return NextResponse.json(
      { error: "Không tìm thấy sự cố" },
      { status: 404 },
    );

  const { history } = (await req.json()) as { history?: ChatTurn[] };
  const turns =
    (history ?? []).length > 0
      ? history!
      : [{ role: "user" as const, text: "Bắt đầu điều tra nguyên nhân." }];
  const questionsAskedSoFar = turns.filter((t) => t.role === "model").length;

  const SMART_QUESTIONS = [
    "Tại sao hiện tượng này lại xảy ra trong ca làm việc vừa qua?",
    "Nguyên nhân nào dẫn đến tình trạng thiết bị / thao tác bị sai lệch như trên?",
    "Tại sao quy trình kiểm tra định kỳ trước đó chưa phát hiện được điểm bất thường này?",
    "Yếu tố kỹ thuật hoặc con người nào là mắt xích chính gây ra sự cố?",
    "Tại sao chưa có cơ chế kiểm soát ngăn ngừa (Poka-yoke) cho công đoạn này?",
  ];

  const baseMessages: AiMessage[] = [
    {
      role: "system",
      content: buildSystemInstruction(
        issue.description,
        issue.failureCategory?.name ?? null,
      ),
    },
    ...turns.map((h) => ({
      role: (h.role === "model" ? "assistant" : "user") as "assistant" | "user",
      content: h.text,
    })),
  ];

  try {
    const rawAiText = await callMultiEngineAi({
      messages: baseMessages,
      maxTokens: 400,
      temperature: 0.3,
      responseFormatJson: true,
    });

    const cleanJson = rawAiText.replace(/```json|```/g, "").trim();
    let parsed = JSON.parse(cleanJson) as Question | Conclusion;

    // Bảo hiểm: nếu AI chốt sớm khi chưa đủ câu hỏi
    if (parsed.type === "conclusion" && questionsAskedSoFar < MAX_QUESTIONS) {
      parsed = {
        type: "question",
        text: SMART_QUESTIONS[questionsAskedSoFar] || "Tại sao vấn đề trên lại tiếp tục xảy ra?",
      };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.warn("[5Whys Engine] Falling back to Smart Rule-based 5 Whys:", err);

    // Smart Local Fallback
    if (questionsAskedSoFar < MAX_QUESTIONS) {
      return NextResponse.json({
        type: "question",
        text:
          SMART_QUESTIONS[questionsAskedSoFar] ||
          "Tại sao vấn đề trên lại phát sinh ở công đoạn này?",
      });
    } else {
      const lastUserAnswer =
        turns.filter((t) => t.role === "user").pop()?.text || "";
      return NextResponse.json({
        type: "conclusion",
        rootCause: `Do ${lastUserAnswer.toLowerCase() || "sai lệch thông số kỹ thuật và hao mòn linh kiện trong quá trình vận hành liên tục"}.`,
        man: "Thao tác chưa đồng đều, cần tái đào tạo quy chuẩn thao tác",
        machine: "Độ rơ cơ khí và hao mòn chi tiết máy sau thời gian vận hành",
        material: "Vật tư đầu vào đạt chuẩn, không phải nguyên nhân chính",
        method: "Chưa cập nhật checklist kiểm tra nhanh đầu ca",
        measurement: "Dụng cụ đo kiểm cần được hiệu chuẩn lại định kỳ",
        environment: "Nhiệt độ và độ ẩm xưởng bình thường, không ảnh hưởng",
      });
    }
  }
}
