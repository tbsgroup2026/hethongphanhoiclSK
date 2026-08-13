import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { NextResponse } from "next/server";

export async function POST() {
  const { response } = await requireAdmin();
  if (response) return response;
  const prisma = await getPrisma();

  try {
    // Delete all users (employees)
    const result = await prisma.user.deleteMany({});

    return NextResponse.json(
      {
        success: true,
        message: `Đã xóa thành công ${result.count} nhân viên khỏi hệ thống`,
        count: result.count,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting all employees:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi khi xóa tất cả nhân viên",
      },
      { status: 500 },
    );
  }
}
