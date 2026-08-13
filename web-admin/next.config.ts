import path from "path";
import type { NextConfig } from "next";

// Chỉ đặt biến này khi build cho Cloudflare (xem package.json: cf:build/cf:deploy).
// Dùng để alias @/lib/prisma-runtime sang bản D1 (workerd) thay vì bản better-sqlite3
// (nodejs) — nhờ đó Turbopack/esbuild loại hẳn client "nodejs" (kèm wasm ~2.3MB +
// package better-sqlite3 12MB) ra khỏi bundle Worker thay vì chỉ né bằng nhánh if/else
// lúc runtime (vốn vẫn bị bundler kéo theo do phân tích tĩnh).
const isCloudflareBuild = process.env.BUILDING_FOR_CLOUDFLARE === "1";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // Next.js luôn trace kèm @vercel/og (resvg.wasm + yoga.wasm + font Geist, ~1.5MB) vào mọi
  // route vì `ImageResponse` được export từ next/server — dự án này không dùng OG image nên
  // loại hẳn ra để bundle Worker đủ nhỏ.
  outputFileTracingExcludes: {
    "*": ["node_modules/next/dist/compiled/@vercel/og/**"],
  },
  turbopack: {
    resolveAlias: {
      "@/lib/prisma-runtime": isCloudflareBuild
        ? "./src/lib/prisma-runtime.cloudflare.ts"
        : "./src/lib/prisma-runtime.local.ts",
    },
  },
  // Build Cloudflare dùng webpack (xem open-next.config.ts) — webpack không đọc config
  // "turbopack" ở trên nên phải khai báo alias tương đương riêng cho webpack ở đây.
  webpack: (config) => {
    config.resolve.alias["@/lib/prisma-runtime"] = path.resolve(
      __dirname,
      isCloudflareBuild
        ? "./src/lib/prisma-runtime.cloudflare.ts"
        : "./src/lib/prisma-runtime.local.ts",
    );
    // Không cho webpack tự parse nội dung file .wasm (mặc định nó thử đọc như JS và vỡ) —
    // giữ nguyên dạng import() thô để OpenNext's esbuild pass sau đó tự nhận diện
    // (wrangler-external.js) và chuyển thành binding wasm thật của Workers.
    config.externals = config.externals || [];
    config.externals.push(({ request }: { request?: string }, callback: (err: null | Error, result?: string) => void) => {
      if (request && /\.wasm(\?module)?$/.test(request)) {
        // Mỗi route (app router tạo 1 chunk server riêng/route) đều import file wasm này —
        // nếu để dạng tương đối, OpenNext quy đường dẫn theo thư mục riêng của TỪNG route
        // (sai, vì file wasm thật chỉ nằm ở 1 chỗ) → ENOENT. Dùng đường dẫn tuyệt đối tới
        // đúng file nguồn để mọi route đều trỏ về cùng 1 vị trí thật.
        const hasQuery = request.endsWith("?module");
        const absPath = path.resolve(
          __dirname,
          "src/generated/prisma-workerd/internal/query_compiler_small_bg.wasm",
        );
        // Loại "module" (không phải "commonjs") để webpack giữ dạng import() ESM thật —
        // binding wasm của Workers chỉ hoạt động với import tĩnh/động ESM, không phải require().
        return callback(null, `module ${absPath}${hasQuery ? "?module" : ""}`);
      }
      callback(null);
    });
    return config;
  },
};

export default nextConfig;
