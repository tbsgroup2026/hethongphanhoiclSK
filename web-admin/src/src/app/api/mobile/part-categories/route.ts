import { getPrisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/require-mobile-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { response } = requireMobileAuth(req);
  if (response) return response;
  const prisma = await getPrisma();

  const categories = await prisma.partCategory.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(categories);
}
