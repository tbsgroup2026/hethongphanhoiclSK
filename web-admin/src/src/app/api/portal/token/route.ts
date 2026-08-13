import { auth } from "@/lib/auth";
import { signMobileToken, MobileTokenPayload } from "@/lib/jwt";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { getPrisma } = await import("@/lib/prisma");
  const prisma = await getPrisma();
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { area: true },
  });

  const sessionUser = session.user as {
    id: string;
    employeeCode?: string;
    role?: MobileTokenPayload["role"];
    name?: string;
  };

  const role = (dbUser?.role || sessionUser.role || "OPERATOR") as MobileTokenPayload["role"];
  const name = dbUser?.name || sessionUser.name || "";
  const employeeCode = dbUser?.employeeCode || sessionUser.employeeCode || "";

  const token = signMobileToken({
    userId: session.user.id,
    employeeCode,
    role,
    name,
  });

  const response = NextResponse.json({
    token,
    user: {
      id: session.user.id,
      employeeCode,
      name,
      role,
      areaId: dbUser?.areaId || null,
      areaName: dbUser?.area?.name || null,
    },
  });

  // Set cookie for transparent SSR / fetch requests
  response.cookies.set("mobile_token", token, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
