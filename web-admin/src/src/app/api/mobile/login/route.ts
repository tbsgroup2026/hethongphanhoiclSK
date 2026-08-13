import { getPrisma } from "@/lib/prisma";
import { signMobileToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const prisma = await getPrisma();
  const { employeeCode, password } = await req.json();

  if (!employeeCode || !password) {
    return NextResponse.json({ error: "Thiếu mã nhân viên hoặc mật khẩu" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { employeeCode } });
  if (!user) {
    return NextResponse.json({ error: "Sai mã nhân viên hoặc mật khẩu" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Sai mã nhân viên hoặc mật khẩu" }, { status: 401 });
  }

  const token = signMobileToken({
    userId: user.id,
    employeeCode: user.employeeCode,
    role: user.role,
    name: user.name,
  });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      employeeCode: user.employeeCode,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
  });
}
