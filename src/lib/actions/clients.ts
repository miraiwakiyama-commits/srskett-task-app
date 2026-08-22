"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

function intOrNull(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function checkbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export async function createClient(formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("企業名は必須です");

  const client = await prisma.client.create({
    data: {
      name,
      contactName: str(formData, "contactName"),
      contactEmail: str(formData, "contactEmail"),
      contactPhone: str(formData, "contactPhone"),
      plan: str(formData, "plan"),
      notes: str(formData, "notes"),
      hasPayroll: checkbox(formData, "hasPayroll"),
      payrollClosingDay: intOrNull(formData, "payrollClosingDay"),
      payrollPayDay: intOrNull(formData, "payrollPayDay"),
      payrollPayMonthOffset: intOrNull(formData, "payrollPayMonthOffset") ?? 1,
    },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(clientId: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("企業名は必須です");

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      contactName: str(formData, "contactName") ?? null,
      contactEmail: str(formData, "contactEmail") ?? null,
      contactPhone: str(formData, "contactPhone") ?? null,
      plan: str(formData, "plan") ?? null,
      notes: str(formData, "notes") ?? null,
      hasPayroll: checkbox(formData, "hasPayroll"),
      payrollClosingDay: intOrNull(formData, "payrollClosingDay"),
      payrollPayDay: intOrNull(formData, "payrollPayDay"),
      payrollPayMonthOffset: intOrNull(formData, "payrollPayMonthOffset") ?? 1,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function deleteClient(clientId: string) {
  await prisma.client.delete({ where: { id: clientId } });
  revalidatePath("/clients");
  redirect("/clients");
}
