import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { callMultiEngineAi } from "@/lib/ai-engine";

export interface ParsedEmployee {
  employeeCode: string;
  name: string;
  phone?: string | null;
  displayPassword?: string | null;
  role:
    | "OPERATOR"
    | "QA"
    | "LINE_LEADER"
    | "TECHNOLOGY"
    | "DEPARTMENT_HEAD"
    | "MAINTENANCE"
    | "DIRECTOR"
    | "ADMIN";
  areaName?: string | null;
  departmentName?: string | null;
  departmentCode?: string | null;
  factoryCode?: string | null;
  factoryName?: string | null;
  status?: "NEW" | "UPDATE";
}

const ROLE_MAPPING: Record<string, ParsedEmployee["role"]> = {
  "van hanh": "OPERATOR",
  "vận hành": "OPERATOR",
  "cong nhan": "OPERATOR",
  "công nhân": "OPERATOR",
  operator: "OPERATOR",
  nv: "OPERATOR",
  "nhân viên": "OPERATOR",
  qa: "QA",
  qc: "QA",
  "kiem soat": "QA",
  "kiểm tra": "QA",
  "truong line": "LINE_LEADER",
  "trưởng line": "LINE_LEADER",
  "to truong": "LINE_LEADER",
  "tổ trưởng": "LINE_LEADER",
  "line leader": "LINE_LEADER",
  line_leader: "LINE_LEADER",
  "t.line": "LINE_LEADER",
  "cong nghe": "TECHNOLOGY",
  "công nghệ": "TECHNOLOGY",
  "ky thuat": "TECHNOLOGY",
  "kỹ thuật": "TECHNOLOGY",
  technology: "TECHNOLOGY",
  "truong phong": "DEPARTMENT_HEAD",
  "trưởng phòng": "DEPARTMENT_HEAD",
  "truong bo phan": "DEPARTMENT_HEAD",
  "trưởng bộ phận": "DEPARTMENT_HEAD",
  "quan doc": "DEPARTMENT_HEAD",
  "quản đốc": "DEPARTMENT_HEAD",
  "department head": "DEPARTMENT_HEAD",
  department_head: "DEPARTMENT_HEAD",
  tp: "DEPARTMENT_HEAD",
  "bao tri": "MAINTENANCE",
  "bảo trì": "MAINTENANCE",
  "ktv bao tri": "MAINTENANCE",
  "kỹ thuật bảo trì": "MAINTENANCE",
  maintenance: "MAINTENANCE",
  "giam doc": "DIRECTOR",
  "giám đốc": "DIRECTOR",
  director: "DIRECTOR",
  gđ: "DIRECTOR",
  admin: "ADMIN",
  "quan tri": "ADMIN",
  "quản trị": "ADMIN",
};

function normalizeRole(raw: string): ParsedEmployee["role"] {
  if (!raw) return "OPERATOR";
  const clean = raw.trim().toLowerCase();
  for (const [key, val] of Object.entries(ROLE_MAPPING)) {
    if (clean === key || clean.includes(key)) {
      return val;
    }
  }
  return "OPERATOR";
}

// Clean Excel formula errors like #REF!, #N/A, #VALUE!, #NAME?
function cleanRefErrors(val: string): string {
  if (/^#(REF|N\/A|VALUE|NAME\??|NULL|NUM|DIV\/0)!?$/i.test(val.trim()))
    return "";
  return val;
}

// Fallback smart parser for CSV, TSV, JSON, and delimited lines
function smartFallbackParser(rawContent: string): ParsedEmployee[] {
  const lines = rawContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^#{1,2}(REF|$)/.test(l));

  if (lines.length === 0) return [];

  // Determine delimiter
  const sampleLine = lines[0];
  let delimiter = ",";
  if (sampleLine.includes("\t")) delimiter = "\t";
  else if (sampleLine.includes(";")) delimiter = ";";
  else if (sampleLine.includes("|")) delimiter = "|";

  const splitLine = (l: string) =>
    l
      .split(delimiter)
      .map((p) => cleanRefErrors(p.trim().replace(/^["']|["']$/g, "")));

  const firstParts = splitLine(lines[0]);
  const firstLower = firstParts.map((p) => p.toLowerCase());

  // Detect header row indices
  let isHeader = false;
  let codeIdx = -1;
  let nameIdx = -1;
  let roleIdx = -1;
  let deptIdx = -1;
  let areaIdx = -1;
  let phoneIdx = -1;
  let passIdx = -1;

  firstLower.forEach((head, idx) => {
    if (
      head.includes("msnv") ||
      head.includes("mã nv") ||
      head.includes("mã_nv") ||
      head.includes("manv") ||
      (head.includes("mã") && !head.includes("máy")) ||
      (head.includes("code") && !head.includes("factory"))
    ) {
      if (codeIdx === -1) codeIdx = idx;
      isHeader = true;
    } else if (
      head.includes("tên") ||
      head.includes("name") ||
      head.includes("họ và tên") ||
      head.includes("ho ten")
    ) {
      if (nameIdx === -1) nameIdx = idx;
      isHeader = true;
    } else if (
      head.includes("vai trò") ||
      head.includes("chức vụ") ||
      head.includes("công việc") ||
      head.includes("role")
    ) {
      if (roleIdx === -1) roleIdx = idx;
      isHeader = true;
    } else if (
      head.includes("số điện thoại") ||
      head.includes("sđt") ||
      head.includes("sdt") ||
      head.includes("phone") ||
      head.includes("điện thoại")
    ) {
      if (phoneIdx === -1) phoneIdx = idx;
      isHeader = true;
    } else if (
      head.includes("phòng ban") ||
      head.includes("phòng") ||
      head.includes("bộ phận") ||
      head.includes("dept")
    ) {
      if (deptIdx === -1) deptIdx = idx;
      isHeader = true;
    } else if (
      head.includes("nm") ||
      head.includes("nhà máy") ||
      head.includes("xưởng") ||
      head.includes("phân xưởng") ||
      head.includes("area")
    ) {
      if (areaIdx === -1) areaIdx = idx;
      isHeader = true;
    } else if (
      head.includes("pass") ||
      head.includes("mật khẩu") ||
      head.includes("password")
    ) {
      if (passIdx === -1) passIdx = idx;
      isHeader = true;
    }
  });

  const results: ParsedEmployee[] = [];
  const startRow = isHeader ? 1 : 0;

  for (let i = startRow; i < lines.length; i++) {
    const parts = splitLine(lines[i]);
    if (parts.length < 2) continue;

    let code = "";
    let name = "";
    let roleRaw = "OPERATOR";
    let area = "PX MAY KG1";
    let dept: string | null = null;
    let phone: string | null = null;
    let pass: string | null = null;

    if (isHeader) {
      code = codeIdx !== -1 && parts[codeIdx] ? parts[codeIdx] : "";
      name = nameIdx !== -1 && parts[nameIdx] ? parts[nameIdx] : code;
      roleRaw = roleIdx !== -1 && parts[roleIdx] ? parts[roleIdx] : "OPERATOR";
      dept = deptIdx !== -1 && parts[deptIdx] ? parts[deptIdx] : null;
      area = areaIdx !== -1 && parts[areaIdx] ? parts[areaIdx] : "PX MAY KG1";
      phone = phoneIdx !== -1 && parts[phoneIdx] ? parts[phoneIdx] : null;
      pass = passIdx !== -1 && parts[passIdx] ? parts[passIdx] : null;
    } else {
      let offset = 0;
      if (/^\d{1,3}$/.test(parts[0])) {
        offset = 1;
      }
      code = parts[offset] || "";
      name = parts[offset + 1] || code;
      roleRaw = parts[offset + 2] || "OPERATOR";
      area = parts[offset + 3] || "PX MAY KG1";
      dept = parts[offset + 4] || null;
      phone = parts[offset + 5] || null;
      pass = parts[offset + 6] || null;
    }

    if (!code) continue;

    results.push({
      employeeCode: code.toUpperCase(),
      name,
      role: normalizeRole(roleRaw),
      areaName: area,
      departmentName: dept,
      departmentCode: dept
        ? dept
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 10)
            .toUpperCase()
        : null,
      phone: phone ? phone.replace(/\D/g, "") : null,
      displayPassword: pass && pass.trim() ? pass.trim() : "tbs123456@",
      factoryCode: "KG1",
      factoryName: "TBS Kiên Giang 1",
    });
  }

  return results;
}

export async function POST(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;
  const prisma = await getPrisma();

  const body = await req.json().catch(() => ({}));
  const { action, content, employees } = body;

  // ─── ACTION 1: PARSE (Phân tích file / văn bản bằng AI) ───────────────────
  if (action === "parse") {
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        {
          error:
            "Nội dung trống. Vui lòng tải file hoặc nhập văn bản danh sách nhân sự.",
        },
        { status: 400 },
      );
    }

    let parsedEmployees: ParsedEmployee[] = [];
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      // Pre-clean the content: replace all Excel formula errors with empty
      const cleanedContent = content.replace(
        /#(REF|N\/A|VALUE|NAME\??|NULL|NUM|DIV\/0)!?/gi,
        "",
      );

      const prompt = `Bạn là trợ lý AI quản trị nhân sự cho nhà máy sản xuất TBS Group.
Nhiệm vụ: đọc bảng danh sách nhân sự bên dưới và trích xuất từng nhân viên thành JSON.

QUAN TRỌNG:
- Dữ liệu có thể chứa lỗi Excel như #REF!, #N/A, #VALUE! → coi như ô trống, BỎ QUA.
- Cột MSNV là MÃ SỐ NHÂN VIÊN (chuỗi số hoặc mã chữ-số). Nếu cột MSNV bị #REF! hoặc trống → BỎ QUA dòng đó.
- employeeCode BẮT BUỘC phải là chuỗi số hoặc mã nhân viên hợp lệ, KHÔNG được là tên người.

CẤU TRÚC CỘT ĐẦU VÀO (thứ tự có thể thay đổi, đọc theo header):
"TT | MSNV | Họ và tên | vai trò | chức vụ | Công việc | Phòng Ban | NM | SĐT | Pass"

Ánh xạ cột:
1. "TT" / "STT" → BỎ QUA (số thứ tự)
2. "MSNV" / "Mã NV" → employeeCode (BẮT BUỘC, viết hoa, phải là chuỗi số/mã)
3. "Họ và tên" / "Tên" → name
4. "vai trò" + "chức vụ" + "Công việc" → Kết hợp 3 cột này để xác định role:
   - "OPERATOR": NV / Nhân viên / Công nhân / Nhân viên vận hành
   - "QA": QA / QC / Kiểm tra chất lượng
   - "LINE_LEADER": Trưởng line / Tổ trưởng / T.LINE
   - "TECHNOLOGY": Kỹ thuật / Công nghệ
   - "DEPARTMENT_HEAD": Trưởng phòng / Quản đốc / TP
   - "MAINTENANCE": Bảo trì / Cơ điện
   - "DIRECTOR": Giám đốc / GĐ
   - "ADMIN": Quản trị viên
5. "Phòng Ban" → departmentName
6. "NM" / "Xưởng" → areaName
7. "SĐT" / "Số điện thoại" → phone (chỉ giữ chữ số)
8. "Pass" / "Mật khẩu" → displayPassword (nếu trống → "tbs123456@")

DỮ LIỆU ĐẦU VÀO:
"""
${cleanedContent.slice(0, 20000)}
"""

Chỉ trả về nhân viên có employeeCode hợp lệ (chuỗi số). Bỏ qua dòng header, dòng trống, dòng có #REF!.
Trả về CHỈ MỘT MẢNG JSON, không giải thích:
[
  {
    "employeeCode": "210909002",
    "name": "ĐỖ ĐỨC QUÂN",
    "role": "DIRECTOR",
    "phone": "0912345678",
    "displayPassword": "tbs123456@",
    "areaName": "PX MAY KG1",
    "departmentName": "ĐH SX",
    "departmentCode": "DHSX",
    "factoryCode": "KG1",
    "factoryName": "TBS Kiên Giang 1"
  }
]`;

      try {
        const rawAiText = await callMultiEngineAi({
          messages: [{ role: "user", content: prompt }],
          maxTokens: 1200,
          temperature: 0.2,
          responseFormatJson: true,
        });
        const cleanJson = rawAiText.replace(/```json|```/g, "").trim();
        parsedEmployees = JSON.parse(cleanJson);
      } catch (err) {
        console.warn("[AI Import Engine] AI parse failed, using smart fallback parser:", err);
      }
    }

    if (!parsedEmployees || parsedEmployees.length === 0) {
      parsedEmployees = smartFallbackParser(content);
    }

    const INVALID_CODES = [
      "TT",
      "STT",
      "MSNV",
      "MÃ NV",
      "CODE",
      "HEADER",
      "MÃ NHÂN VIÊN",
      "#REF!",
      "#N/A",
      "#VALUE!",
      "#NAME?",
      "",
    ];
    const INVALID_NAMES = [
      "MSNV",
      "HỌ VÀ TÊN",
      "HỌ TÊN",
      "NAME",
      "#REF!",
      "#N/A",
      "",
    ];

    parsedEmployees = parsedEmployees.filter((emp) => {
      if (!emp || !emp.employeeCode) return false;
      const codeClean = emp.employeeCode.toUpperCase().trim();
      const nameClean = (emp.name || "").toUpperCase().trim();
      // Filter out header rows and Excel formula errors
      if (
        INVALID_CODES.includes(codeClean) ||
        INVALID_NAMES.includes(nameClean)
      ) {
        return false;
      }
      // Also filter out codes that look like names (contain spaces and no digits)
      if (codeClean.includes(" ") && !/\d/.test(codeClean)) {
        return false;
      }
      // Filter out #REF! pattern
      if (/^#/.test(codeClean)) {
        return false;
      }
      return true;
    });

    if (parsedEmployees.length === 0) {
      return NextResponse.json(
        {
          error:
            "Không nhận diện được danh sách nhân sự. Vui lòng kiểm tra lại định dạng file (CSV, Excel text, hoặc bảng danh sách).",
        },
        { status: 422 },
      );
    }

    const existingCodes = new Set(
      (await prisma.user.findMany({ select: { employeeCode: true } })).map(
        (u) => u.employeeCode.toUpperCase(),
      ),
    );

    const enriched = parsedEmployees.map((emp) => ({
      ...emp,
      employeeCode: emp.employeeCode.toUpperCase().trim(),
      role: normalizeRole(emp.role),
      displayPassword:
        emp.displayPassword && emp.displayPassword.trim()
          ? emp.displayPassword.trim()
          : "tbs123456@",
      status: existingCodes.has(emp.employeeCode.toUpperCase().trim())
        ? ("UPDATE" as const)
        : ("NEW" as const),
    }));

    return NextResponse.json({
      success: true,
      count: enriched.length,
      employees: enriched,
    });
  }

  // ─── ACTION 2: COMMIT (Lưu danh sách đã xác nhận vào DB & Tạo tài khoản) ────
  if (action === "commit") {
    const list: ParsedEmployee[] = Array.isArray(employees) ? employees : [];
    if (list.length === 0) {
      return NextResponse.json(
        { error: "Không có danh sách nhân sự để lưu." },
        { status: 400 },
      );
    }

    const defaultPasswordHash = await bcrypt.hash("tbs123456@", 10);
    let createdCount = 0;
    let updatedCount = 0;

    const defaultFactory = await prisma.factory.upsert({
      where: { code: "KG1" },
      update: {},
      create: {
        code: "KG1",
        name: "Nhà máy TBS Kiên Giang 1",
        address: "Khu công nghiệp Thạnh Lộc, Châu Thành, Kiên Giang",
      },
    });

    for (const item of list) {
      const code = item.employeeCode.toUpperCase().trim();
      if (!code) continue;

      // 1. Resolve Factory
      let factoryId = defaultFactory.id;
      if (item.factoryCode && item.factoryCode !== "KG1") {
        const factory = await prisma.factory.upsert({
          where: { code: item.factoryCode.trim().toUpperCase() },
          update: { name: item.factoryName || item.factoryCode },
          create: {
            code: item.factoryCode.trim().toUpperCase(),
            name: item.factoryName || `Nhà máy ${item.factoryCode}`,
          },
        });
        factoryId = factory.id;
      }

      // 2. Resolve Area (Category type AREA)
      let areaId: string | null = null;
      if (item.areaName && item.areaName.trim()) {
        const areaName = item.areaName.trim();
        const area = await prisma.category.findFirst({
          where: { type: "AREA", name: areaName },
        });
        if (area) {
          areaId = area.id;
        } else {
          const newArea = await prisma.category.create({
            data: {
              type: "AREA",
              name: areaName,
              factoryId,
            },
          });
          areaId = newArea.id;
        }
      }

      // 3. Resolve Department if provided
      let departmentId: string | null = null;
      if (item.departmentName && item.departmentName.trim()) {
        const deptName = item.departmentName.trim();
        const deptCode =
          (
            item.departmentCode ||
            deptName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)
          ).toUpperCase() || "DEPT";

        const dept = await prisma.department.findFirst({
          where: { name: deptName, factoryId },
        });
        if (dept) {
          departmentId = dept.id;
        } else {
          const newDept = await prisma.department.create({
            data: {
              factoryId,
              code: deptCode,
              name: deptName,
            },
          });
          departmentId = newDept.id;
        }
      }

      // 4. Resolve Password & Hash
      const userPass =
        item.displayPassword && item.displayPassword.trim()
          ? item.displayPassword.trim()
          : "tbs123456@";
      const userPassHash =
        item.displayPassword && item.displayPassword.trim()
          ? await bcrypt.hash(userPass, 10)
          : defaultPasswordHash;

      // 5. Upsert User
      const existingUser = await prisma.user.findUnique({
        where: { employeeCode: code },
      });

      let userId: string;

      if (existingUser) {
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: item.name.trim(),
            role: item.role,
            phone: item.phone ? item.phone.trim() : existingUser.phone,
            passwordHash:
              item.displayPassword && item.displayPassword.trim()
                ? userPassHash
                : existingUser.passwordHash,
            displayPassword: userPass,
            areaId: areaId || existingUser.areaId,
            factoryId,
          },
        });
        userId = updated.id;
        updatedCount++;
      } else {
        const created = await prisma.user.create({
          data: {
            employeeCode: code,
            name: item.name.trim(),
            role: item.role,
            phone: item.phone ? item.phone.trim() : null,
            passwordHash: userPassHash,
            displayPassword: userPass,
            areaId,
            factoryId,
          },
        });
        userId = created.id;
        createdCount++;
      }

      // 6. Connect Department Member
      if (departmentId) {
        const isHead = item.role === "DEPARTMENT_HEAD";
        const existingMember = await prisma.departmentMember.findUnique({
          where: {
            departmentId_userId: {
              departmentId,
              userId,
            },
          },
        });

        if (!existingMember) {
          await prisma.departmentMember.create({
            data: {
              departmentId,
              userId,
              isHead,
            },
          });
        } else if (existingMember.isHead !== isHead) {
          await prisma.departmentMember.update({
            where: { id: existingMember.id },
            data: { isHead },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã nhập dữ liệu thành công: Tạo mới ${createdCount} nhân sự, Cập nhật ${updatedCount} nhân sự.`,
      createdCount,
      updatedCount,
      totalCount: createdCount + updatedCount,
    });
  }

  return NextResponse.json(
    { error: "Hành động không hợp lệ" },
    { status: 400 },
  );
}
