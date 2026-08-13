import { getPrisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/require-mobile-auth";
import { userPublicSelect } from "@/lib/selects";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { payload, response } = requireMobileAuth(req);
  if (response) return response;
  const prisma = await getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      ...userPublicSelect,
      createdAt: true,
      area: { select: { id: true, name: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });

  let stats: { totalTasks: number; completedTasks: number } | null = null;
  if (user.role === "MAINTENANCE") {
    const [totalTasks, completedTasks] = await Promise.all([
      prisma.maintenanceTask.count({ where: { assigneeId: user.id } }),
      prisma.maintenanceTask.count({ where: { assigneeId: user.id, status: "DONE" } }),
    ]);
    stats = { totalTasks, completedTasks };
  }

  return NextResponse.json({ ...user, stats });
}

export async function PUT(req: Request) {
  const { payload, response } = requireMobileAuth(req);
  if (response) return response;
  const prisma = await getPrisma();

  const { avatarUrl } = await req.json();

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: { avatarUrl },
    select: userPublicSelect,
  });

  return NextResponse.json(user);
}
