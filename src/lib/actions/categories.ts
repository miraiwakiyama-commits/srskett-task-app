"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TASK_CATEGORY_LABELS } from "@/lib/constants";

const BUILT_IN_LABELS = new Set(Object.values(TASK_CATEGORY_LABELS));

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("種別名を入力してください");
  if (BUILT_IN_LABELS.has(name)) {
    throw new Error("この名前は標準の種別と同じため使用できません");
  }

  const existing = await prisma.taskCategoryDef.findUnique({ where: { name } });
  if (existing) throw new Error("同じ名前の種別が既に存在します");

  const count = await prisma.taskCategoryDef.count();
  await prisma.taskCategoryDef.create({ data: { name, order: count } });

  revalidatePath("/templates");
  revalidatePath("/tasks/new");
  revalidatePath("/tasks");
}

export async function deleteCategory(categoryId: string) {
  const category = await prisma.taskCategoryDef.findUnique({ where: { id: categoryId } });
  if (!category) return;

  const templateCount = await prisma.taskTemplate.count({ where: { category: category.name } });
  if (templateCount > 0) {
    throw new Error("テンプレートがあるため削除できません。");
  }

  await prisma.taskCategoryDef.delete({ where: { id: categoryId } });
  revalidatePath("/templates");
  revalidatePath("/tasks/new");
  revalidatePath("/tasks");
}
