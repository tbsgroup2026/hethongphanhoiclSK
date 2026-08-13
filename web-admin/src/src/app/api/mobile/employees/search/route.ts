import { getPrisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/require-mobile-auth";
import { NextResponse } from "next/server";

// Dùng để Trưởng phòng ban tìm nhân viên Bảo trì CÙNG khu vực khi giao việc — luôn lọc theo
// areaId của người gọi, không cho tìm/gán người ở khu vực khác.
export async function GET(req: Request) {
  const { payload, response } = requireMobileAuth(req);
  if (response) return response;
  const prisma = await getPrisma();

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || url.searchParams.get("code") || "").trim();

  const ASSIGNABLE_ROLES = ["OPERATOR", "LINE_LEADER", "QA", "TECHNOLOGY", "MAINTENANCE"];

  const employees = await prisma.user.findMany({
    where: {
      role: { in: ASSIGNABLE_ROLES as never },
      ...(q
        ? {
            OR: [
              { employeeCode: { contains: q } },
              { name: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    select: { id: true, employeeCode: true, name: true, phone: true, role: true, area: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    take: 50,
  });

  return NextResponse.json(employees);
}
