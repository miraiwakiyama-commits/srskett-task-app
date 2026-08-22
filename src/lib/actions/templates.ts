"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

function intVal(formData: FormData, key: string, fallback = 0): number {
  const v = str(formData, key);
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function createTemplate(formData: FormData) {
  const category = str(formData, "category");
  const subType = str(formData, "subType");
  const name = str(formData, "name");
  if (!category || !subType || !name) throw new Error("必須項目が不足しています");

  const template = await prisma.taskTemplate.create({
    data: {
      category,
      subType,
      name,
      description: str(formData, "description"),
      baseDateLabel: str(formData, "baseDateLabel") ?? "起算日",
      titleTemplate: str(formData, "titleTemplate") ?? null,
    },
  });

  revalidatePath("/templates");
  redirect(`/templates/${template.id}`);
}

export async function updateTemplate(templateId: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("テンプレート名は必須です");

  await prisma.taskTemplate.update({
    where: { id: templateId },
    data: {
      name,
      description: str(formData, "description") ?? null,
      baseDateLabel: str(formData, "baseDateLabel") ?? "起算日",
      titleTemplate: str(formData, "titleTemplate") ?? null,
    },
  });

  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}`);
}

export async function toggleTemplateActive(templateId: string, isActive: boolean) {
  await prisma.taskTemplate.update({ where: { id: templateId }, data: { isActive } });
  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}`);
}

export async function deleteTemplate(templateId: string) {
  await prisma.taskTemplate.delete({ where: { id: templateId } });
  revalidatePath("/templates");
  redirect("/templates");
}

export async function addTemplateItem(templateId: string, formData: FormData) {
  const title = str(formData, "title");
  if (!title) return;
  const count = await prisma.templateItem.count({ where: { templateId } });
  await prisma.templateItem.create({
    data: {
      templateId,
      title,
      order: count + 1,
      dueBasis: str(formData, "dueBasis") ?? "TASK_CREATED",
      dueOffsetDays: intVal(formData, "dueOffsetDays", 0),
    },
  });
  revalidatePath(`/templates/${templateId}`);
}

export async function updateTemplateItem(templateId: string, itemId: string, formData: FormData) {
  const title = str(formData, "title");
  if (!title) return;
  await prisma.templateItem.update({
    where: { id: itemId },
    data: {
      title,
      dueBasis: str(formData, "dueBasis") ?? "TASK_CREATED",
      dueOffsetDays: intVal(formData, "dueOffsetDays", 0),
    },
  });
  revalidatePath(`/templates/${templateId}`);
}

export async function deleteTemplateItem(templateId: string, itemId: string) {
  await prisma.templateItem.delete({ where: { id: itemId } });
  revalidatePath(`/templates/${templateId}`);
}
