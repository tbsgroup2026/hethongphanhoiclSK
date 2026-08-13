import { requireMobileAuth } from "@/lib/require-mobile-auth";
import { saveBase64Image } from "@/lib/save-upload";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { response } = requireMobileAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { base64, mimeType } = body;
    if (!base64) {
      return NextResponse.json({ error: "Thiếu dữ liệu ảnh" }, { status: 400 });
    }

    const url = await saveBase64Image(base64, mimeType);
    return NextResponse.json({ url });
  } catch (err: unknown) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Lỗi không xác định khi tải ảnh";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

