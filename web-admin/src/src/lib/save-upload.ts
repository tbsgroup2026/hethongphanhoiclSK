import { randomUUID } from "crypto";

export async function saveBase64Image(base64: string, mimeType: string | undefined) {
  const ext = mimeType === "image/png" ? "png" : "jpg";
  const fileName = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(base64, "base64");

  const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
  if (buffer.byteLength > MAX_SIZE_BYTES) {
    throw new Error("Kích thước ảnh vượt quá giới hạn 2MB cho phép");
  }

  // 1. Cloudflare Workers context (R2 hoặc D1)
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });

    if (context?.env?.UPLOADS) {
      await context.env.UPLOADS.put(fileName, buffer, {
        httpMetadata: { contentType: mimeType || "image/jpeg" },
      });
      return `/api/files/${fileName}`;
    }

    if (context?.env?.DB) {
      const stmt = context.env.DB.prepare(
        "INSERT OR REPLACE INTO file_uploads (key, data, mimeType, size) VALUES (?, ?, ?, ?)"
      );
      await stmt.bind(fileName, base64, mimeType || "image/jpeg", buffer.byteLength).run();
      return `/api/files/${fileName}`;
    }
  } catch (cfErr) {
    console.warn("Cloudflare context not available or error:", cfErr);
  }

  // 2. Local filesystem fallback (chỉ dùng trong môi trường Dev Node.js)
  try {
    const { mkdir, writeFile } = await import("fs/promises");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);
    return `/uploads/${fileName}`;
  } catch (fsErr) {
    console.error("Local filesystem upload error:", fsErr);
    throw new Error("Không thể lưu ảnh lên hệ thống lưu trữ");
  }
}

