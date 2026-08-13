import { PrismaClient } from "@/generated/prisma-workerd/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function createPrismaInstance() {
  const context = await getCloudflareContext({ async: true });
  if (!context.env.DB) {
    throw new Error("Thiếu D1 binding 'DB' — kiểm tra lại wrangler.jsonc");
  }
  const adapter = new PrismaD1(context.env.DB);
  return new PrismaClient({ adapter });
}
