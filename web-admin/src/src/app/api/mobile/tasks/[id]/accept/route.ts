import { getPrisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/require-mobile-auth";
import { sendPushToUsersByRoleInArea, sendPushToUsers } from "@/lib/push";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { payload, response } = requireMobileAuth(req);
  if (response) return response;
  const prisma = await getPrisma();
  const { id } = await params;

  const task = await prisma.maintenanceTask.findUnique({ where: { id }, include: { issue: true } });
  if (!task) return NextResponse.json({ error: "Không tìm thấy việc" }, { status: 404 });
  if (task.assigneeId !== payload.userId && payload.role !== "ADMIN" && payload.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Nhiệm vụ này không được phân công cho bạn" }, { status: 403 });
  }
  if (task.status !== "PENDING") {
    return NextResponse.json({ error: "Việc này đã được nhận" }, { status: 409 });
  }

  const activeTask = await prisma.maintenanceTask.findFirst({
    where: { assigneeId: payload.userId, status: "ACCEPTED" },
    include: { issue: true },
  });
  if (activeTask) {
    return NextResponse.json(
      { error: `Bạn đang xử lý PO ${activeTask.issue.poCode} — vui lòng hoàn thành trước khi nhận việc khác` },
      { status: 409 },
    );
  }

  const now = new Date();
  const [updatedTask] = await prisma.$transaction([
    prisma.maintenanceTask.update({
      where: { id },
      data: { status: "ACCEPTED", acceptedAt: now },
    }),
    prisma.qualityIssue.update({ where: { id: task.issueId }, data: { status: "IN_PROGRESS" } }),
  ]);

  // 1. Ghi log Audit Trail
  const { logAuditEvent } = await import("@/lib/audit-logger");
  const roleNameMap: Record<string, string> = {
    OPERATOR: "Tổ trưởng",
    LINE_LEADER: "Trưởng Line",
    QA: "QA",
    TECHNOLOGY: "Công nghệ",
    MAINTENANCE: "Bảo trì",
    DEPARTMENT_HEAD: "Quản Đốc",
    DIRECTOR: "Giám Đốc",
    ADMIN: "Quản trị viên",
  };
  const userRoleName = roleNameMap[payload.role] || payload.role;

  await logAuditEvent(prisma, {
    issueId: task.issueId,
    userId: payload.userId,
    action: "TASK_ACCEPTED",
    oldStatus: "ASSIGNED",
    newStatus: "IN_PROGRESS",
    note: `${userRoleName} ${payload.name} nhận việc lúc ${now.toLocaleTimeString("vi-VN")}`,
  });

  // 2. Dispatch thông báo tới Người báo cáo và Trưởng line
  const { createAndDispatchNotification, dispatchRoleNotificationsInArea } = await import("@/lib/notifications-service");
  await createAndDispatchNotification(prisma, [task.issue.reporterId], {
    title: `Đã nhận việc — PO ${task.issue.poCode}`,
    message: `${payload.name} đã nhận xử lý sự cố bạn báo lúc ${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}.`,
    kind: "TASK_ACCEPTED",
    issueId: task.issueId,
    data: { type: "TASK_ACCEPTED", issueId: task.issueId, taskId: id },
  });

  await dispatchRoleNotificationsInArea(
    prisma,
    ["LINE_LEADER"],
    task.issue.areaId,
    {
      title: `Đã nhận việc — PO ${task.issue.poCode}`,
      message: `${payload.name} đã nhận việc lúc ${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}.`,
      kind: "TASK_ACCEPTED",
      issueId: task.issueId,
      data: { type: "TASK_ACCEPTED", issueId: task.issueId, taskId: id },
    },
    { excludeUserId: payload.userId },
  );

  return NextResponse.json(updatedTask);
}

