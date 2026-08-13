import { getPrisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/require-mobile-auth";
import { userPublicSelect } from "@/lib/selects";
import { NextResponse } from "next/server";

const issueInclude = {
  reporter: { select: userPublicSelect },
  area: true,
  team: true,
  productionLine: true,
  failureCategory: true,
  submissions: { include: { submitter: { select: userPublicSelect } } },
  task: {
    include: {
      assignee: { select: userPublicSelect },
      assignedBy: { select: userPublicSelect },
      verifiedBy: { select: userPublicSelect },
    },
  },
} as const;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = requireMobileAuth(req);
  if (response) return response;
  const prisma = await getPrisma();
  const { id } = await params;

  const issue = await prisma.qualityIssue.findUnique({ where: { id }, include: issueInclude });
  if (!issue) return NextResponse.json({ error: "Không tìm thấy sự cố" }, { status: 404 });

  return NextResponse.json(issue);
}
