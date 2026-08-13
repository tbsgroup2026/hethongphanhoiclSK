import { getPrisma } from "@/lib/prisma";
import { broadcast } from "@/lib/notificationHub";
import { requireMobileAuth } from "@/lib/require-mobile-auth";
import { userPublicSelect } from "@/lib/selects";
import { sendPushToUsersByRoleInArea } from "@/lib/push";
import type { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

const INVESTIGATION_WINDOW_MS = 15 * 60 * 1000;
const INVESTIGATOR_ROLES = ["QA", "LINE_LEADER", "TECHNOLOGY"];

const issueInclude = {
  reporter: { select: userPublicSelect },
  area: true,
  team: true,
  productionLine: true,
  failureCategory: true,
  submissions: { include: { submitter: { select: userPublicSelect } } },
  task: {
    include: {
      assignee: { select: userPublicSelect },
      assignedBy: { select: userPublicSelect },
    },
  },
} as const;

// Danh sách phiếu liên quan tới người dùng hiện tại — dùng cho "Hoạt động sự cố gần đây" ở Trang
// chủ. Phạm vi mở rộng theo vai trò để nhóm điều tra/xử lý cũng thấy được sự cố cần họ xử lý,
// không chỉ phiếu do chính họ báo cáo:
// - Vận hành: chỉ phiếu do chính mình báo cáo.
// - QA/Trưởng line/Công nghệ/Trưởng phòng ban: phiếu tự báo cáo + mọi phiếu trong khu vực mình.
// - Bảo trì: phiếu tự báo cáo + phiếu đang/đã được giao cho mình.
// - Giám đốc: toàn bộ phiếu (không giới hạn khu vực).
export async function GET(req: Request) {
  const { payload, response } = requireMobileAuth(req);
  if (response) return response;
  const prisma = await getPrisma();

  const url = new URL(req.url);
  const isAll = url.searchParams.get("all") === "true";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "300", 10), 1000);

  const me = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { areaId: true },
  });

  let where: Prisma.QualityIssueWhereInput = {};
  if (isAll || ["DIRECTOR", "ADMIN", "DEPARTMENT_HEAD"].includes(payload.role)) {
    // Ban Giám đốc, Quản trị viên, Trưởng phòng ban hoặc xem báo cáo thống kê toàn nhà máy
    where = {};
  } else if (["QA", "LINE_LEADER", "TECHNOLOGY"].includes(payload.role)) {
    // QA, Trưởng line, Công nghệ: xem sự cố trong xưởng của mình hoặc toàn xưởng nếu chưa gán xưởng
    where = me?.areaId
      ? { OR: [{ reporterId: payload.userId }, { areaId: me.areaId }] }
      : {};
  } else if (payload.role === "MAINTENANCE") {
    // Bảo trì: xem sự cố được giao, sự cố trong xưởng hoặc toàn bộ sự cố kỹ thuật
    where = me?.areaId
      ? { OR: [{ reporterId: payload.userId }, { areaId: me.areaId }, { task: { assigneeId: payload.userId } }] }
      : {};
  } else {
    // Nhân viên vận hành: xem phiếu tự báo cáo hoặc phiếu trong xưởng mình (hoặc tất cả nếu chưa gán xưởng)
    where = me?.areaId
      ? { OR: [{ reporterId: payload.userId }, { areaId: me.areaId }] }
      : {};
  }

  const issues = await prisma.qualityIssue.findMany({
    where,
    include: issueInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(issues);
}

export async function POST(req: Request) {
  const { payload, response } = requireMobileAuth(req);
  if (response) return response;
  const prisma = await getPrisma();

  const { areaId, teamId, productionLineId, failureCategoryId, otherFailureNote, severity, poCode, description, images } =
    await req.json();

  if (!poCode || !description) {
    return NextResponse.json({ error: "Thiếu mã PO hoặc mô tả" }, { status: 400 });
  }
  const VALID_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  if (!severity || !VALID_SEVERITIES.includes(severity)) {
    return NextResponse.json({ error: "Vui lòng chọn mức độ nghiêm trọng" }, { status: 400 });
  }
  // Chọn "Khác" ở danh mục lỗi (không có failureCategoryId thật) thì bắt buộc mô tả riêng.
  if (!failureCategoryId && !otherFailureNote) {
    return NextResponse.json({ error: "Vui lòng chọn danh mục lỗi hoặc mô tả lỗi khác" }, { status: 400 });
  }

  // Khu vực dùng để định tuyến thông báo/phân việc cho đúng QA/Trưởng line/Công nghệ/Trưởng
  // phòng ban/Bảo trì cùng khu vực đó — người báo cáo chọn trực tiếp trong form (combobox); mặc
  // định gợi ý khu vực của chính họ nhưng có thể đổi (VD: NV vận hành phát hiện sự cố ở khu vực
  // khác). Nếu client không gửi (client cũ), fallback về khu vực của người báo cáo.
  let resolvedAreaId: string | null = areaId || null;
  if (resolvedAreaId) {
    const area = await prisma.category.findUnique({ where: { id: resolvedAreaId } });
    if (!area || area.type !== "AREA") {
      return NextResponse.json({ error: "Khu vực/Xưởng không hợp lệ" }, { status: 400 });
    }
  } else {
    const reporter = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { areaId: true },
    });
    resolvedAreaId = reporter?.areaId ?? null;
  }

  const issue = await prisma.qualityIssue.create({
    data: {
      reporterId: payload.userId,
      areaId: resolvedAreaId,
      teamId: teamId || null,
      productionLineId: productionLineId || null,
      failureCategoryId: failureCategoryId || null,
      otherFailureNote: failureCategoryId ? null : otherFailureNote,
      severity,
      poCode,
      description,
      images: images ? JSON.stringify(images) : null,
      status: "REPORTED",
      investigationDeadline: new Date(Date.now() + INVESTIGATION_WINDOW_MS),
    },
    include: issueInclude,
  });

  const severityPrefix = severity === "URGENT" ? "🚨 KHẨN CẤP — " : severity === "HIGH" ? "⚠️ Mức cao — " : "";
  
  // 1. Ghi log Audit Trail
  const { logAuditEvent } = await import("@/lib/audit-logger");
  await logAuditEvent(prisma, {
    issueId: issue.id,
    userId: payload.userId,
    action: "REPORTED",
    newStatus: "REPORTED",
    note: `${payload.name} báo cáo sự cố PO ${issue.poCode}: ${description}`,
  });

  // 2. Gửi thông báo đa kênh tới tất cả phòng ban liên quan (QA, Trưởng line, Công nghệ, Trưởng phòng, Giám đốc, Bảo trì, Admin)
  const ALL_NOTIFIED_ROLES = [
    "QA",
    "LINE_LEADER",
    "TECHNOLOGY",
    "DEPARTMENT_HEAD",
    "DIRECTOR",
    "MAINTENANCE",
    "ADMIN",
  ];
  const { dispatchRoleNotificationsInArea, sendZaloReportMessage } = await import("@/lib/notifications-service");
  await dispatchRoleNotificationsInArea(
    prisma,
    ALL_NOTIFIED_ROLES,
    issue.areaId,
    {
      title: `${severityPrefix}Sự cố mới — PO ${issue.poCode}`,
      message: `${payload.name} báo cáo: ${description}`,
      kind: "NEED_INVESTIGATE",
      issueId: issue.id,
      data: { type: "NEED_INVESTIGATE", issueId: issue.id },
    },
    {
      excludeUserId: payload.userId,
      includeOperatorFyi: true,
    },
  );

  // 3. Tự động soạn tin nhắn và chuyển tiếp báo cáo vào Zalo (0522511245 & nhóm App HỆ THỐNG PHẢN HỒI NHANH)
  try {
    await sendZaloReportMessage(issue);
  } catch (zaloErr) {
    console.warn("[Zalo Notification] Error dispatching report message:", zaloErr);
  }

  await broadcast(issue.reporterId, "issueCreated", issue);
  return NextResponse.json(issue, { status: 201 });
}

