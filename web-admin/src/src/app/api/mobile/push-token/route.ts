import { getPrisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/require-mobile-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { payload, response } = requireMobileAuth(req);
  if (response) return response;
  const prisma = await getPrisma();

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Thiếu push token" }, { status: 400 });

  await prisma.user.update({
    where: { id: payload.userId },
    data: { pushToken: token },
  });

  return NextResponse.json({ ok: true });
}
