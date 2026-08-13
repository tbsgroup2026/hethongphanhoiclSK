import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  const prisma = await getPrisma();

  const employees = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      employeeCode: true,
      name: true,
      phone: true,
      role: true,
      areaId: true,
      displayPassword: true,
      area: { select: { id: true, name: true } },
      createdAt: true,
    },
  });
  return NextResponse.json(employees);
}

export async function POST(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;
  const prisma = await getPrisma();

  const body = await req.json();
  const { employeeCode, name, phone, password, role, areaId } = body;

  if (!employeeCode || !name || !password || !role) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { employeeCode } });
  if (existing) {
    return NextResponse.json({ error: "Mã nhân viên đã tồn tại" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      employeeCode,
      name,
      phone,
      passwordHash,
      displayPassword: password || "tbs123456@",
      role,
      areaId: areaId || null,
    },
    select: {
      id: true,
      employeeCode: true,
      name: true,
      phone: true,
      role: true,
      areaId: true,
      displayPassword: true,
      area: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(user, { status: 201 });
}
