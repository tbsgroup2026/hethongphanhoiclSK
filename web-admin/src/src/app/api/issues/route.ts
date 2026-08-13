import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  const prisma = await getPrisma();

  const issues = await prisma.qualityIssue.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      reporter: { select: { id: true, name: true, employeeCode: true } },
      area: true,
      team: true,
      productionLine: true,
      failureCategory: true,
      task: {
        include: {
          assignee: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(issues);
}
