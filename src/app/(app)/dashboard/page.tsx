import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import DashboardItemRow, { type DashboardRow } from "@/components/DashboardItemRow";
import type { Prisma } from "@/generated/prisma/client";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER, type TaskStatus } from "@/lib/constants";
import { MascotBubble, EmptyStateMascot, randomCheerMessage } from "@/components/Mascot";
import { buildCategoryColorMap, categoryColor, type CategoryColorSet } from "@/lib/categoryColors";

const STATUS_BAR_COLOR: Record<TaskStatus, string> = {
  NOT_STARTED: "bg-slate-400",
  IN_PROGRESS: "bg-blue-500",
  PENDING_REVIEW: "bg-amber-500",
  DONE: "bg-emerald-500",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const sp = await searchParams;
  const scope = sp.scope === "mine" ? "mine" : "all";
  const session = await getSession();

  const now = new Date();
  const in7days = new Date(now);
  in7days.setDate(now.getDate() + 7);
  in7days.setHours(23, 59, 59, 999);
  const in14days = new Date(now);
  in14days.setDate(now.getDate() + 14);
  in14days.setHours(23, 59, 59, 999);

  const scopeFilter: Prisma.TaskWhereInput = scope === "mine" && session ? { assigneeId: session.userId } : {};

  const [
    overdueItems,
    overdueTasksNoChecklist,
    dueSoonItems,
    dueSoonTasksNoChecklist,
    futureItems,
    futureTasksNoChecklist,
    statusGroups,
    next14DaysItems,
    clientCount,
    customCategories,
  ] = await Promise.all([
    // 期限が過ぎている未チェックのチェックリスト項目
    prisma.checklistItem.findMany({
      where: { done: false, dueDate: { lt: now }, task: { ...scopeFilter, status: { not: "DONE" } } },
      orderBy: { dueDate: "asc" },
      include: { task: { include: { client: true, assignee: true } } },
    }),
    // チェックリストが無いタスク自体の期限切れ(チェックリストがなければ項目として出しようがないため、タスク単位で表示)
    prisma.task.findMany({
      where: { ...scopeFilter, status: { not: "DONE" }, dueDate: { lt: now }, checklist: { none: {} } },
      orderBy: { dueDate: "asc" },
      include: { client: true, assignee: true },
    }),
    prisma.checklistItem.findMany({
      where: {
        done: false,
        dueDate: { gte: now, lte: in7days },
        task: { ...scopeFilter, status: { not: "DONE" } },
      },
      orderBy: { dueDate: "asc" },
      include: { task: { include: { client: true, assignee: true } } },
    }),
    prisma.task.findMany({
      where: {
        ...scopeFilter,
        status: { not: "DONE" },
        dueDate: { gte: now, lte: in7days },
        checklist: { none: {} },
      },
      orderBy: { dueDate: "asc" },
      include: { client: true, assignee: true },
    }),
    // 今後8日以降(7日以内より先)に締切のある未チェックの項目
    prisma.checklistItem.findMany({
      where: {
        done: false,
        dueDate: { gt: in7days },
        task: { ...scopeFilter, status: { not: "DONE" } },
      },
      orderBy: { dueDate: "asc" },
      include: { task: { include: { client: true, assignee: true } } },
    }),
    prisma.task.findMany({
      where: {
        ...scopeFilter,
        status: { not: "DONE" },
        dueDate: { gt: in7days },
        checklist: { none: {} },
      },
      orderBy: { dueDate: "asc" },
      include: { client: true, assignee: true },
    }),
    // ステータス別のタスク件数(対応中件数・未完了合計の算出用)
    prisma.task.groupBy({ by: ["status"], where: scopeFilter, _count: { _all: true } }),
    // 今後14日間に締切のあるチェックリスト項目(完了数の算出・内訳バーの両方に使う)
    prisma.checklistItem.findMany({
      where: { dueDate: { gte: now, lte: in14days }, task: scopeFilter },
      select: { done: true, task: { select: { status: true } } },
    }),
    prisma.client.count(),
    prisma.taskCategoryDef.findMany({ orderBy: { order: "asc" }, select: { name: true } }),
  ]);

  const categoryColorMap = buildCategoryColorMap(customCategories);
  const overdueRows = mergeRows(overdueItems, overdueTasksNoChecklist, categoryColorMap);
  const dueSoonRows = mergeRows(dueSoonItems, dueSoonTasksNoChecklist, categoryColorMap);
  const futureRows = mergeRows(futureItems, futureTasksNoChecklist, categoryColorMap);

  const statusCounts = Object.fromEntries(TASK_STATUS_ORDER.map((s) => [s, 0])) as Record<TaskStatus, number>;
  for (const g of statusGroups) statusCounts[g.status as TaskStatus] = g._count._all;
  const totalTaskCount = TASK_STATUS_ORDER.reduce((sum, s) => sum + statusCounts[s], 0);
  const inProgressCount = statusCounts.IN_PROGRESS;
  const allOpenCount = totalTaskCount - statusCounts.DONE;

  const next14DaysChecklistTotal = next14DaysItems.length;
  const next14DaysChecklistDone = next14DaysItems.filter((i) => i.done).length;

  // 今後14日間に締切のあるチェックリスト項目を、そのタスクの現在のステータス別に集計(内訳バー用)
  const checklistStatusCounts = Object.fromEntries(TASK_STATUS_ORDER.map((s) => [s, 0])) as Record<
    TaskStatus,
    number
  >;
  for (const item of next14DaysItems) {
    const s = item.task.status as TaskStatus;
    if (s in checklistStatusCounts) checklistStatusCounts[s]++;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-slate-900">ダッシュボード</h1>
        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-sm">
          <Link
            href="/dashboard?scope=mine"
            className={`rounded px-3 py-1.5 font-medium ${
              scope === "mine" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            自分のタスク
          </Link>
          <Link
            href="/dashboard?scope=all"
            className={`rounded px-3 py-1.5 font-medium ${
              scope === "all" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            所内全体
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChecklistHeroCard
          label="今後14日間の完了数"
          done={next14DaysChecklistDone}
          total={next14DaysChecklistTotal}
        />
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {overdueRows.length === 0 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">遅延項目</p>
              <p className="mt-1 text-sm font-bold text-emerald-700">遅延なし!</p>
              <MascotBubble message={randomCheerMessage()} className="mt-2" />
            </div>
          ) : (
            <SummaryCard label="遅延項目" value={overdueRows.length} tone="red" />
          )}
          <SummaryCard label="7日以内が期限の項目" value={dueSoonRows.length} tone="amber" />
          <SummaryCard label="対応中タスク" value={inProgressCount} tone="blue" />
          <SummaryCard label="未完了タスク合計" value={allOpenCount} tone="slate" />
        </div>
      </div>

      <StatusProgressBar statusCounts={checklistStatusCounts} totalTaskCount={next14DaysChecklistTotal} />

      <p className="mt-2 text-xs text-slate-400">
        クライアント登録数: {clientCount}社 ・ {scope === "mine" ? `${session?.name ?? ""} さんの担当分を表示中` : "事務所内全員のタスクを表示中"}
      </p>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-base font-bold text-red-700">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          遅延項目
        </h2>
        <RowList rows={overdueRows} emptyMessage="遅延している項目はありません" />
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-base font-bold text-amber-700">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          期限が近い項目(7日以内)
        </h2>
        <RowList rows={dueSoonRows} emptyMessage="7日以内に期限を迎える項目はありません" />
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-600">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          今後8日以降の項目
        </h2>
        <RowList rows={futureRows} emptyMessage="該当する項目はありません" />
      </section>
    </div>
  );
}

type ItemWithTask = {
  id: string;
  title: string;
  dueDate: Date | null;
  taskId: string;
  task: {
    title: string;
    status: string;
    category: string;
    subType: string;
    client: { name: string };
    assignee: { name: string } | null;
  };
};

type TaskNoChecklist = {
  id: string;
  title: string;
  status: string;
  category: string;
  subType: string;
  dueDate: Date | null;
  client: { name: string };
  assignee: { name: string } | null;
};

function mergeRows(
  items: ItemWithTask[],
  tasks: TaskNoChecklist[],
  categoryColorMap: Record<string, CategoryColorSet>
): DashboardRow[] {
  const itemRows: DashboardRow[] = items.map((i) => {
    const color = categoryColor(categoryColorMap, i.task.category);
    return {
      kind: "item",
      key: `item-${i.id}`,
      dueDate: i.dueDate,
      itemId: i.id,
      itemTitle: i.title,
      taskId: i.taskId,
      taskTitle: i.task.title,
      taskStatus: i.task.status,
      category: i.task.category,
      subType: i.task.subType,
      clientName: i.task.client.name,
      assigneeName: i.task.assignee?.name ?? null,
      colorBg: color.bg,
      colorBorder: color.border,
    };
  });
  const taskRows: DashboardRow[] = tasks.map((t) => {
    const color = categoryColor(categoryColorMap, t.category);
    return {
      kind: "task",
      key: `task-${t.id}`,
      dueDate: t.dueDate,
      taskId: t.id,
      taskTitle: t.title,
      taskStatus: t.status,
      category: t.category,
      subType: t.subType,
      clientName: t.client.name,
      assigneeName: t.assignee?.name ?? null,
      colorBg: color.bg,
      colorBorder: color.border,
    };
  });
  return [...itemRows, ...taskRows].sort((a, b) => {
    const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return da - db;
  });
}

function SummaryCard({
  label,
  value,
  tone,
  delta,
}: {
  label: string;
  value: number;
  tone: "red" | "amber" | "blue" | "slate" | "emerald";
  delta?: number;
}) {
  const toneClass = {
    red: "text-red-700",
    amber: "text-amber-700",
    blue: "text-blue-700",
    slate: "text-slate-700",
    emerald: "text-emerald-700",
  }[tone];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
        {delta !== undefined && delta !== 0 && (
          <span className={`text-xs font-semibold ${delta > 0 ? "text-emerald-600" : "text-slate-400"}`}>
            {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`} (先月比)
          </span>
        )}
      </div>
    </div>
  );
}

function rateColorClasses(rate: number | null): { text: string; bar: string } {
  if (rate === null) return { text: "text-slate-400", bar: "bg-slate-300" };
  if (rate >= 80) return { text: "text-blue-700", bar: "bg-blue-500" };
  if (rate >= 50) return { text: "text-emerald-700", bar: "bg-emerald-500" };
  if (rate >= 30) return { text: "text-orange-700", bar: "bg-orange-500" };
  return { text: "text-red-700", bar: "bg-red-500" };
}

function ChecklistHeroCard({ label, done, total }: { label: string; done: number; total: number }) {
  const rate = total > 0 ? Math.round((done / total) * 100) : null;
  const color = rateColorClasses(rate);
  return (
    <div className="flex h-full flex-col justify-center rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-2 flex items-center gap-5">
        <div className="shrink-0">
          <p className={`text-4xl font-bold ${color.text}`}>{rate !== null ? `${rate}%` : "—"}</p>
          <p className="mt-1 text-xs text-slate-400">{done}/{total}件</p>
        </div>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full transition-[width] ${color.bar}`} style={{ width: `${rate ?? 0}%` }} />
        </div>
      </div>
    </div>
  );
}

function StatusProgressBar({
  statusCounts,
  totalTaskCount,
}: {
  statusCounts: Record<TaskStatus, number>;
  totalTaskCount: number;
}) {
  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">タスクの内訳</p>
      {totalTaskCount === 0 ? (
        <p className="mt-2 text-sm text-slate-400">今後14日以内に締切のあるチェックリストはありません</p>
      ) : (
        <>
          <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
            {TASK_STATUS_ORDER.map((s) =>
              statusCounts[s] > 0 ? (
                <div
                  key={s}
                  className={STATUS_BAR_COLOR[s]}
                  style={{ width: `${(statusCounts[s] / totalTaskCount) * 100}%` }}
                  title={`${TASK_STATUS_LABELS[s]}: ${statusCounts[s]}件`}
                />
              ) : null
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {TASK_STATUS_ORDER.map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${STATUS_BAR_COLOR[s]}`} />
                {TASK_STATUS_LABELS[s]} {statusCounts[s]}件
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RowList({ rows, emptyMessage }: { rows: DashboardRow[]; emptyMessage: string }) {
  if (rows.length === 0) {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
        <EmptyStateMascot message={emptyMessage} />
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-2">
      {rows.map((row) => (
        <DashboardItemRow key={row.key} row={row} />
      ))}
    </div>
  );
}
