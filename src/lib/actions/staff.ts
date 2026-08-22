"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword } from "@/lib/auth";
import { getSession } from "@/lib/auth";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

export async function createStaff(formData: FormData) {
  const name = str(formData, "name");
  const email = str(formData, "email");
  const password = str(formData, "password");
  if (!name || !email || !password) throw new Error("氏名・メールアドレス・パスワードは必須です");
  if (password.length < 8) throw new Error("パスワードは8文字以上にしてください");

  const existing = await prisma.staffUser.findUnique({ where: { email } });
  if (existing) throw new Error("このメールアドレスは既に登録されています");

  const passwordHash = await hashPassword(password);
  await prisma.staffUser.create({
    data: {
      name,
      email,
      passwordHash,
      role: str(formData, "role") ?? "staff",
    },
  });

  revalidatePath("/staff");
  redirect("/staff");
}

export async function updateStaff(staffId: string, formData: FormData) {
  const name = str(formData, "name");
  const email = str(formData, "email");
  if (!name || !email) throw new Error("氏名・メールアドレスは必須です");

  const password = str(formData, "password");
  if (password && password.length < 8) throw new Error("パスワードは8文字以上にしてください");

  await prisma.staffUser.update({
    where: { id: staffId },
    data: {
      name,
      email,
      role: str(formData, "role") ?? "staff",
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });

  revalidatePath("/staff");
  redirect("/staff");
}

export async function deleteStaff(staffId: string) {
  const session = await getSession();
  if (session?.userId === staffId) {
    throw new Error("ログイン中の自分自身は削除できません");
  }

  const count = await prisma.staffUser.count();
  if (count <= 1) {
    throw new Error("最後の1名は削除できません");
  }

  await prisma.staffUser.delete({ where: { id: staffId } });
  revalidatePath("/staff");
  redirect("/staff");
}
