"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  generateCustomCategoryTask,
  generateGrantTask,
  generateHrTask,
  generateMonthlyPayrollTasks,
  recomputeTaskFromBaseDate,
} from "@/lib/taskGeneration";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

function dateOrNull(formData: FormData, key: string): Date | null {
  const v = str(formData, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * ステータスをDONEに変更した瞬間のみcompletedAtを記録し、DONEから他へ戻したら消す。
 * 月間タスク処理数の集計はこのcompletedAtを基準にする。
 */
async function statusUpdateData(taskId: string, newStatus: string) {
  const current = await prisma.task.findUnique({ where: { id: taskId }, select: { status: true } });
  if (!current || current.status === newStatus) return { status: newStatus };
  if (newStatus === "DONE") return { status: newStatus, completedAt: new Date() };
  if (current.status === "DONE") return { status: newStatus, completedAt: null };
  return { status: newStatus };
}

/**
 * ステータスをDONEにする。未チェックのチェックリスト項目があれば一括でチェックを付けてから完了にする。
 * (未チェックがある状態で完了にする場合は、呼び出し側でユーザーに確認を取ってから呼ぶこと)
 */
async function markTaskDone(taskId: string) {
  await prisma.checklistItem.updateMany({ where: { taskId, done: false }, data: { done: true } });
  const statusData = await statusUpdateData(taskId, "DONE");
  await prisma.task.update({ where: { id: taskId }, data: statusData });
}

export async function createTask(formData: FormData) {
  const title = str(formData, "title");
  const category = str(formData, "category");
  const subType = str(formData, "subType");
  const clientId = str(formData, "clientId");
  if (!title || !category || !subType || !clientId) {
    throw new Error("必須項目が不足しています");
  }

  const task = await prisma.task.create({
    data: {
      title,
      category,
      subType,
      grantType: category === "GRANT" ? subType : undefined,
      clientId,
      assigneeId: str(formData, "assigneeId") ?? null,
      dueDate: dateOrNull(formData, "dueDate"),
      status: str(formData, "status") ?? "NOT_STARTED",
      description: str(formData, "description") ?? null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect(`/tasks/${task.id}`);
}

export async function updateTask(taskId: string, formData: FormData) {
  const title = str(formData, "title");
  if (!title) throw new Error("タイトルは必須です");

  const newStatus = str(formData, "status") ?? "NOT_STARTED";

  if (newStatus === "DONE") {
    await markTaskDone(taskId);
    await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        clientId: str(formData, "clientId"),
        assigneeId: str(formData, "assigneeId") ?? null,
        dueDate: dateOrNull(formData, "dueDate"),
        description: str(formData, "description") ?? null,
      },
    });
  } else {
    const statusData = await statusUpdateData(taskId, newStatus);
    await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        clientId: str(formData, "clientId"),
        assigneeId: str(formData, "assigneeId") ?? null,
        dueDate: dateOrNull(formData, "dueDate"),
        description: str(formData, "description") ?? null,
        ...statusData,
      },
    });
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/dashboard");
  redirect(`/tasks/${taskId}`);
}

export async function updateTaskStatus(taskId: string, status: string) {
  if (status === "DONE") {
    await markTaskDone(taskId);
  } else {
    const statusData = await statusUpdateData(taskId, status);
    await prisma.task.update({ where: { id: taskId }, data: statusData });
  }
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/dashboard");
}

export async function updateTaskBaseDate(taskId: string, formData: FormData) {
  const baseDate = dateOrNull(formData, "baseDate");
  if (!baseDate) throw new Error("起算日を入力してください");

  await recomputeTaskFromBaseDate(taskId, baseDate);

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect("/tasks");
}

export async function addChecklistItem(taskId: string, formData: FormData) {
  const title = str(formData, "title");
  if (!title) return;
  const count = await prisma.checklistItem.count({ where: { taskId } });
  await prisma.checklistItem.create({
    data: {
      taskId,
      title,
      order: count + 1,
      dueDate: dateOrNull(formData, "dueDate"),
    },
  });
  revalidatePath(`/tasks/${taskId}`);
}

export async function toggleChecklistItem(taskId: string, itemId: string, done: boolean) {
  await prisma.checklistItem.update({ where: { id: itemId }, data: { done } });

  if (done) {
    const items = await prisma.checklistItem.findMany({ where: { taskId }, select: { done: true } });
    const allDone = items.length > 0 && items.every((i) => i.done);
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { status: true } });
    if (allDone) {
      if (task && task.status !== "DONE") {
        const statusData = await statusUpdateData(taskId, "DONE");
        await prisma.task.update({ where: { id: taskId }, data: statusData });
      }
    } else if (task && task.status === "NOT_STARTED") {
      // 未着手のタスクで1つでもチェックが付いたら、対応中に自動で変更する
      const statusData = await statusUpdateData(taskId, "IN_PROGRESS");
      await prisma.task.update({ where: { id: taskId }, data: statusData });
    }
  } else {
    // 完了状態から1つでもチェックを外したら、対応中に自動で戻す
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { status: true } });
    if (task && task.status === "DONE") {
      const statusData = await statusUpdateData(taskId, "IN_PROGRESS");
      await prisma.task.update({ where: { id: taskId }, data: statusData });
    }
  }

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteChecklistItem(taskId: string, itemId: string) {
  await prisma.checklistItem.delete({ where: { id: itemId } });
  revalidatePath(`/tasks/${taskId}`);
}

export async function addNote(taskId: string, formData: FormData) {
  const body = str(formData, "body");
  if (!body) return;
  const session = await getSession();
  await prisma.note.create({
    data: { taskId, body, authorId: session?.userId },
  });
  revalidatePath(`/tasks/${taskId}`);
}

export async function addAttachmentLink(taskId: string, formData: FormData) {
  const url = str(formData, "url");
  if (!url) throw new Error("URLを入力してください");
  if (!/^https?:\/\//.test(url)) throw new Error("http(s)から始まるURLを入力してください");

  await prisma.attachment.create({
    data: {
      taskId,
      label: str(formData, "label") ?? null,
      url,
    },
  });

  revalidatePath(`/tasks/${taskId}`);
}

export async function deleteAttachment(taskId: string, attachmentId: string) {
  await prisma.attachment.delete({ where: { id: attachmentId } });
  revalidatePath(`/tasks/${taskId}`);
}

export async function runGenerateMonthlyPayroll(year: number, month1: number) {
  const created = await generateMonthlyPayrollTasks(year, month1);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return created;
}

export async function createHrTask(formData: FormData) {
  const clientId = str(formData, "clientId");
  const subType = str(formData, "subType");
  const targetName = str(formData, "targetName");
  const baseDate = dateOrNull(formData, "baseDate");
  if (!clientId || !subType || !targetName || !baseDate) {
    throw new Error("必須項目が不足しています");
  }

  const task = await generateHrTask({
    clientId,
    subType: subType as "ONBOARDING" | "OFFBOARDING",
    targetName,
    baseDate,
    assigneeId: str(formData, "assigneeId"),
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect(`/tasks/${task.id}`);
}

export async function createCustomCategoryTask(formData: FormData) {
  const category = str(formData, "category");
  const clientId = str(formData, "clientId");
  if (!category || !clientId) throw new Error("必須項目が不足しています");

  const task = await generateCustomCategoryTask({
    category,
    clientId,
    templateId: str(formData, "templateId"),
    title: str(formData, "title"),
    assigneeId: str(formData, "assigneeId"),
    startDate: dateOrNull(formData, "startDate") ?? undefined,
    dueDate: dateOrNull(formData, "dueDate") ?? undefined,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect(`/tasks/${task.id}`);
}

export async function createGrantTask(formData: FormData) {
  const clientId = str(formData, "clientId");
  const grantTemplateId = str(formData, "grantTemplateId");
  if (!clientId || !grantTemplateId) throw new Error("必須項目が不足しています");

  const task = await generateGrantTask({
    clientId,
    grantTemplateId,
    title: str(formData, "title"),
    assigneeId: str(formData, "assigneeId"),
    startDate: dateOrNull(formData, "startDate") ?? undefined,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect(`/tasks/${task.id}`);
}
