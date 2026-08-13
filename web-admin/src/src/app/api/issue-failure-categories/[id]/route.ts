import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;
  const prisma = await getPrisma();
  const { id } = await params;

  const { name, order } = await req.json();
  const category = await prisma.issueFailureCategory.update({
    where: { id },
    data: { name, order },
  });
  return NextResponse.json(category);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;
  const prisma = await getPrisma();
  const { id } = await params;

  try {
    await prisma.issueFailureCategory.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "Không thể xoá — danh mục này đang được sử dụng" },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
