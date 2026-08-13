import { getPrisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/require-mobile-auth";
import { sendPushToUsers } from "@/lib/push";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { payload, response } = requireMobileAuth(req);
  if (response) return response;
  const prisma = await getPrisma();
  const { id } = await params;

  if (!["DEPARTMENT_HEAD", "DIRECTOR", "ADMIN"].includes(payload.role)) {
    return NextResponse.json({ error: "Chỉ Quản đốc / Giám đốc mới được giao việc hoặc phân công lại" }, { status: 403 });
  }

  const issue = await prisma.qualityIssue.findUnique({ where: { id }, include: { task: true } });
  if (!issue) return NextResponse.json({ error: "Không tìm thấy sự cố" }, { status: 404 });

  const isDirectorOrAdmin = payload.role === "DIRECTOR" || payload.role === "ADMIN";
  const isDeptHead = payload.role === "DEPARTMENT_HEAD";

  // Cho phép giao việc nếu đã có nguyên nhân hoặc phân công lại
  if (!["ROOT_CAUSE_FOUND", "ASSIGNED", "IN_PROGRESS"].includes(issue.status) && !isDirectorOrAdmin) {
    return NextResponse.json({ error: "Sự cố này chưa sẵn sàng để giao việc" }, { status: 409 });
  }

  const { assigneeId } = await req.json();
  if (!assigneeId) return NextResponse.json({ error: "Vui lòng chọn nhân viên thực hiện" }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { id: payload.userId }, select: { areaId: true } });
  const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
  const ALLOWED_ROLES = ["OPERATOR", "LINE_LEADER", "QA", "TECHNOLOGY", "MAINTENANCE"];
  if (!assignee || !ALLOWED_ROLES.includes(assignee.role)) {
    return NextResponse.json({ error: "Người được chọn phải là Tổ trưởng, Trưởng Line, QA, Công nghệ hoặc Bảo trì" }, { status: 400 });
  }
  // Giám đốc / Admin có quyền phân công toàn nhà máy
  if (!isDirectorOrAdmin && me?.areaId && assignee.areaId && assignee.areaId !== me.areaId) {
    return NextResponse.json(
      { error: "Chỉ được giao việc cho nhân viên cùng khu vực/xưởng" },
      { status: 400 },
    );
  }

  let task;
  const isReassign = !!issue.task;

  if (isReassign) {
    // Phân người làm lại / Điều chuyển nhân viên xử lý
    task = await prisma.maintenanceTask.update({
      where: { id: issue.task!.id },
      data: {
        assigneeId,
        assignedById: payload.userId,
        status: "PENDING",
        acceptedAt: null,
        completedAt: null,
        repairDetail: null,
        partsReplaced: null,
        imagesBefore: null,
        imagesAfter: null,
        verifiedStatus: "PENDING",
        monitoringStartedAt: null,
      },
    });
    await prisma.qualityIssue.update({ where: { id }, data: { status: "ASSIGNED" } });
  } else {
    // Giao việc lần đầu
    [task] = await prisma.$transaction([
      prisma.maintenanceTask.create({
        data: { issueId: id, assignedById: payload.userId, assigneeId, status: "PENDING" },
      }),
      prisma.qualityIssue.update({ where: { id }, data: { status: "ASSIGNED" } }),
    ]);
  }

  // 1. Ghi log Audit Trail
  const { logAuditEvent } = await import("@/lib/audit-logger");
  const roleNameMap: Record<string, string> = {
    OPERATOR: "Tổ trưởng",
    LINE_LEADER: "Trưởng Line",
    QA: "QA",
    TECHNOLOGY: "Công nghệ",
    MAINTENANCE: "Bảo trì",
  };
  const assigneeRoleName = roleNameMap[assignee.role] || assignee.role;
  const noteText = isDirectorOrAdmin && isReassign
    ? `Giám đốc (${payload.name}) phân công lại nhiệm vụ cho ${assigneeRoleName} ${assignee.name} (${assignee.employeeCode})`
    : `${payload.name} (${payload.role === "DIRECTOR" ? "Giám đốc" : "Quản đốc"}) ${isReassign ? "phân công lại" : "giao việc"} cho ${assigneeRoleName} ${assignee.name} (${assignee.employeeCode})`;

  await logAuditEvent(prisma, {
    issueId: id,
    userId: payload.userId,
    action: "TASK_ASSIGNED",
    oldStatus: issue.status,
    newStatus: "ASSIGNED",
    note: noteText,
  });

  // 2. Dispatch thông báo tới Bảo trì
  const { createAndDispatchNotification } = await import("@/lib/notifications-service");
  await createAndDispatchNotification(prisma, [assigneeId], {
    title: isReassign ? "Nhiệm vụ bảo trì được phân công lại" : "Có việc cần trợ giúp",
    message: `PO ${issue.poCode}: ${issue.description}`,
    kind: "TASK_ASSIGNED",
    issueId: id,
    data: { type: "TASK_ASSIGNED", issueId: id, taskId: task.id },
  });

  return NextResponse.json(task, { status: 201 });
}

