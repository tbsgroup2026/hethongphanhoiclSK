import { getPrisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/require-mobile-auth";
import { NextResponse } from "next/server";
import { callMultiEngineAi, AiMessage } from "@/lib/ai-engine";

const submitterRoleLabel: Record<string, string> = {
  QA: "QA",
  LINE_LEADER: "Trưởng line",
  TECHNOLOGY: "Công nghệ",
};

// Trưởng line bấm "AI tổng hợp gợi ý" — gộp 3 nguyên nhân gốc (từ QA/Trưởng line/Công nghệ) +
// toàn bộ 5M+1E thành 1 kết luận chung, kèm đề xuất giải pháp
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { payload, response } = requireMobileAuth(req);
  if (response) return response;
  const { id } = await params;
  const prisma = await getPrisma();

  if (!["LINE_LEADER", "DEPARTMENT_HEAD", "DIRECTOR", "ADMIN"].includes(payload.role)) {
    return NextResponse.json(
      { error: "Chỉ Trưởng line, Trưởng phòng hoặc Giám đốc mới được dùng chức năng này" },
      { status: 403 },
    );
  }

  const issue = await prisma.qualityIssue.findUnique({
    where: { id },
    include: {
      failureCategory: true,
      submissions: {
        include: { submitter: true },
        orderBy: { submittedAt: "asc" },
      },
    },
  });
  if (!issue)
    return NextResponse.json(
      { error: "Không tìm thấy sự cố" },
      { status: 404 },
    );
  if (issue.submissions.length === 0) {
    return NextResponse.json(
      { error: "Chưa có bản 5M+1E nào để tổng hợp" },
      { status: 409 },
    );
  }

  const rootCausesList = issue.submissions
    .map((s) => s.rootCause)
    .filter(Boolean);
  const fallbackRootCause =
    rootCausesList.length > 0
      ? `Tổng hợp từ các góc nhìn: ${rootCausesList.join("; ")}.`
      : "Sai lệch thông số kỹ thuật và hao mòn chi tiết cơ khí sau thời gian hoạt động.";
  const fallbackSolution =
    "Bảo trì kiểm tra, thay thế linh kiện hao mòn và cân chỉnh lại thông số chuẩn theo tài liệu kỹ thuật.";

  const submissionsText = issue.submissions
    .map((s, i) => {
      const roleLabel = submitterRoleLabel[s.submitterRole] ?? s.submitterRole;
      return `[Bản ${i + 1} - ${roleLabel}]: ${s.rootCause || "Chưa có"} | Man: ${s.man} | Machine: ${s.machine} | Method: ${s.method}`;
    })
    .join("\n");

  const prompt = `Chuyên gia phân tích chất lượng nhà máy TBS Group.
Vấn đề: "${issue.description}"${issue.failureCategory ? ` (${issue.failureCategory.name})` : ""}
Dữ liệu 5M+1E:
${submissionsText}

Nhiệm vụ:
1. Tổng hợp 1 NGUYÊN NHÂN GỐC RỄ chung, ngắn gọn (rootCause).
2. Đề xuất 1 GIẢI PHÁP xử lý cụ thể, khả thi 2-3 câu (solution).
3. Đánh giá outOfScope (true/false) và sosReason nếu vượt thẩm quyền cấp xưởng.
Trả về CHỈ JSON:
{"rootCause":"...","solution":"...","outOfScope":false,"sosReason":""}`;

  const messages: AiMessage[] = [
    { role: "user", content: prompt }
  ];

  try {
    const rawAiText = await callMultiEngineAi({
      messages,
      maxTokens: 500,
      temperature: 0.3,
      responseFormatJson: true,
    });

    const cleanJson = rawAiText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({
      rootCause: parsed.rootCause || fallbackRootCause,
      solution: parsed.solution || fallbackSolution,
      outOfScope: !!parsed.outOfScope,
      sosReason: parsed.sosReason || "",
    });
  } catch (err) {
    console.warn("[Synthesize 5M1E Engine] Falling back to Smart Rule-based synthesis:", err);
    return NextResponse.json({
      rootCause: fallbackRootCause,
      solution: fallbackSolution,
      outOfScope: false,
      sosReason: "",
    });
  }
}
