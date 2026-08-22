import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { categorySubtitle, TASK_STATUS_ORDER } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import DueBadge from "@/components/DueBadge";
import ChecklistProgress from "@/components/ChecklistProgress";
import TaskFilterBar from "@/components/TaskFilterBar";
import { EmptyStateMascot } from "@/components/Mascot";
import type { Prisma } from "@/generated/prisma/client";

// 絞り込み条件が未指定(初回表示)の場合、「完了」以外にチェックが入った状態をデフォルトにする
const DEFAULT_STATUS_FILTER = TASK_STATUS_ORDER.filter((s) => s !== "DONE");

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string | string[]; clientId?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status
    ? Array.isArray(sp.status)
      ? sp.status
      : [sp.status]
    : DEFAULT_STATUS_FILTER;

  const where: Prisma.TaskWhereInput = {};
  if (sp.category) where.category = sp.category;
  if (statusFilter.length > 0) where.status = { in: statusFilter };
  if (sp.clientId) where.clientId = sp.clientId;
  if (sp.q) where.title = { contains: sp.q };

  const [tasks, clients, customCategories] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: { client: true, assignee: true, checklist: { select: { done: true } } },
      take: 200,
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.taskCategoryDef.findMany({ orderBy: { order: "asc" }, select: { name: true } }),
  ]);

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "status" || !value) continue;
    if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    } else {
      qs.append(key, value);
    }
  }
  for (const s of statusFilter) qs.append("status", s);
  const qsString = qs.toString();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-slate-900">タスク</h1>
        <div className="flex gap-2">
          <a
            href={`/api/tasks/export${qsString ? `?${qsString}` : ""}`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            CSVエクスポート
          </a>
          <Link
            href="/tasks/new"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            + 新規タスク
          </Link>
        </div>
      </div>

      <TaskFilterBar
        clients={clients}
        customCategories={customCategories}
        initialCategory={sp.category ?? ""}
        initialStatus={statusFilter}
        initialClientId={sp.clientId ?? ""}
        initialQ={sp.q ?? ""}
      />

      <div className="mt-4 space-y-2">
        {tasks.map((t) => (
          <Link
            key={t.id}
            href={`/tasks/${t.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-indigo-300"
          >
            <div>
              <p className="text-xs text-slate-400">
                {categorySubtitle(t.category, t.subType)} ・ {t.client.name}
              </p>
              <p className="text-sm font-medium text-slate-900">{t.title}</p>
              <p className="text-xs text-slate-400">担当: {t.assignee?.name ?? "未割当"}</p>
            </div>
            <div className="flex items-center gap-3">
              <ChecklistProgress
                done={t.checklist.filter((i) => i.done).length}
                total={t.checklist.length}
                size="sm"
              />
              <DueBadge dueDate={t.dueDate} status={t.status} />
              <StatusBadge status={t.status} />
            </div>
          </Link>
        ))}
        {tasks.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
            <EmptyStateMascot message="条件に一致するタスクがありません" />
          </div>
        )}
      </div>
    </div>
  );
}
