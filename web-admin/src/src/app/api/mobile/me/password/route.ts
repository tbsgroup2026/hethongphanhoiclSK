import { getPrisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/require-mobile-auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { payload, response } = requireMobileAuth(req);
  if (response) return response;
  const prisma = await getPrisma();

  const { oldPassword, newPassword } = await req.json();
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "Thiếu mật khẩu" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Mật khẩu cũ không đúng" }, { status: 401 });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      displayPassword: newPassword,
      passwordChangedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
