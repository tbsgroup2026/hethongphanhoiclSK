import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PortalShell from "./portal-shell";
import { UserPublic } from "@/lib/portal-client";

export const metadata = {
  title: "TBS Portal — Hệ thống Quản lý Sự cố Chất lượng",
  description: "Cổng thông tin và xử lý sự cố chất lượng 5M+1E theo luồng nghiệp vụ TBS Group",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const sessionUser = session.user as {
    id: string;
    employeeCode: string;
    name: string;
    role: UserPublic["role"];
    areaId?: string | null;
    areaName?: string | null;
  };


  const { getPrisma } = await import("@/lib/prisma");
  const prisma = await getPrisma();
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { area: true },
  });

  const user: UserPublic = {
    id: sessionUser.id,
    employeeCode: dbUser?.employeeCode || sessionUser.employeeCode,
    name: dbUser?.name || sessionUser.name,
    role: (dbUser?.role || sessionUser.role) as UserPublic["role"],
    areaId: dbUser?.areaId || null,
    area: dbUser?.area ? { id: dbUser.area.id, type: "AREA", name: dbUser.area.name } : null,
  };

  return <PortalShell user={user}>{children}</PortalShell>;
}
