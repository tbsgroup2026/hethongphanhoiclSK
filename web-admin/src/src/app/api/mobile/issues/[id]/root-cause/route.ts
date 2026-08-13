import { getPrisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/require-mobile-auth";
import { sendPushToUsersByRoleInArea } from "@/lib/push";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { payload, response } = requireMobileAuth(req);
  if (response) return response;
  const prisma = await getPrisma();
  const { id } = await params;

  if (!["LINE_LEADER", "DEPARTMENT_HEAD", "DIRECTOR", "ADMIN"].includes(payload.role)) {
    return NextResponse.json({ error: "Chỉ Quản đốc, Trưởng line hoặc Giám đốc mới có quyền chốt/sửa nguyên nhân gốc" }, { status: 403 });
  }

  const issue = await prisma.qualityIssue.findUnique({ where: { id } });
  if (!issue) return NextResponse.json({ error: "Không tìm thấy sự cố" }, { status: 404 });

  const isDirectorOrAdmin = payload.role === "DIRECTOR" || payload.role === "ADMIN";
  const isDeptHead = payload.role === "DEPARTMENT_HEAD";

  // Nếu không phải Giám đốc / Admin / Quản đốc, chỉ cho phép chốt khi đang ở trạng thái điều tra
  if (!isDirectorOrAdmin && !isDeptHead && !["REPORTED", "INVESTIGATING"].includes(issue.status)) {
    return NextResponse.json({ error: "Sự cố này chưa sẵn sàng để chốt nguyên nhân" }, { status: 409 });
  }

  const { rootCause, solution } = await req.json();
  if (!rootCause || !String(rootCause).trim()) {
    return NextResponse.json({ error: "Vui lòng nhập nguyên nhân gốc" }, { status: 400 });
  }

  const newStatus = ["REPORTED", "INVESTIGATING"].includes(issue.status)
    ? "ROOT_CAUSE_FOUND"
    : issue.status;

  const updated = await prisma.qualityIssue.update({
    where: { id },
    data: {
      rootCause: String(rootCause).trim(),
      solution: solution ? String(solution).trim() : null,
      rootCauseDecidedById: payload.userId,
      rootCauseDecidedAt: new Date(),
      status: newStatus,
    },
  });

  // 1. Ghi log Audit Trail
  const { logAuditEvent } = await import("@/lib/audit-logger");
  const isOverride = issue.rootCause && issue.rootCause !== String(rootCause).trim();

  const actionDesc = isDirectorOrAdmin && isOverride
    ? `Giám đốc (${payload.name}) điều chỉnh nguyên nhân gốc: ${rootCause}.${solution ? ` Giải pháp mới: ${solution}` : ""}`
    : `${payload.name} (${payload.role}) chốt nguyên nhân gốc: ${rootCause}.${solution ? ` Đề xuất giải pháp: ${solution}` : ""}`;

  await logAuditEvent(prisma, {
    issueId: id,
    userId: payload.userId,
    action: "ROOT_CAUSE_DECIDED",
    oldStatus: issue.status,
    newStatus: newStatus,
    note: actionDesc,
  });

  // 2. Thông báo cho Quản đốc / Giám đốc nếu chuyển sang ROOT_CAUSE_FOUND
  if (newStatus === "ROOT_CAUSE_FOUND" && issue.status !== "ROOT_CAUSE_FOUND") {
    const { dispatchRoleNotificationsInArea } = await import("@/lib/notifications-service");
    await dispatchRoleNotificationsInArea(prisma, ["DEPARTMENT_HEAD", "DIRECTOR"], issue.areaId, {
      title: `Đã có nguyên nhân gốc — PO ${issue.poCode}`,
      message: rootCause,
      kind: "NEED_ASSIGN",
      issueId: id,
      data: { type: "NEED_ASSIGN", issueId: id },
    });
  }

  return NextResponse.json(updated);
}

