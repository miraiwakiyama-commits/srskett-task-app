import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // スタッフ削除やDBリセット後も古いセッションCookieが残っていることがあるため、
  // 参照先のスタッフが実在するか確認する。Server Componentからはcookieを削除できないので、
  // 古いCookie自体はログイン時(Route Handler側)に新しい値で上書きされるのに任せる。
  const staffExists = await prisma.staffUser.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });
  if (!staffExists) {
    redirect("/login");
  }

  return <AppShell userName={session.name}>{children}</AppShell>;
}
