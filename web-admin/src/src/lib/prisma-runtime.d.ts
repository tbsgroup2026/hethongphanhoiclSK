// Đây là khai báo module "ảo" cho @/lib/prisma-runtime — KHÔNG có file thật cùng tên.
// Việc chọn file thật (prisma-runtime.local.ts hay prisma-runtime.cloudflare.ts) do
// next.config.ts (turbopack.resolveAlias / webpack resolve.alias) quyết định lúc build.
// Nếu thêm entry này vào tsconfig.json "paths" thay vì dùng declare module, Next.js sẽ tự
// tích hợp tsconfig paths vào cả webpack resolver — khiến nó ưu tiên hơn alias ta tự set,
// làm sai bản được bundle (đã từng xảy ra: luôn ra bản "local" dù build cho Cloudflare).
declare module "@/lib/prisma-runtime" {
  import type { PrismaClient } from "@/generated/prisma/client";

  export function createPrismaInstance(): Promise<InstanceType<typeof PrismaClient>>;
}
