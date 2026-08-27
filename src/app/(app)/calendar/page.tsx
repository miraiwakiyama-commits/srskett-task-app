import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildMonthGrid, buildTwoWeekGrid, fmt, isSameMonth, isToday } from "@/lib/dates";
import { categoryLabel } from "@/lib/constants";
import { buildCategoryColorMap, categoryColor } from "@/lib/categoryColors";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; view?: string; start?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const view = sp.view === "2weeks" ? "2weeks" : "month";

  const year = sp.year ? Number(sp.year) : now.getFullYear();
  const month1 = sp.month ? Number(sp.month) : now.getMonth() + 1;

  let weeks: Date[][];
  let monthStart: Date | null = null;

  if (view === "2weeks") {
    const start = sp.start ? new Date(sp.start) : now;
    ({ weeks } = buildTwoWeekGrid(Number.isNaN(start.getTime()) ? now : start));
  } else {
    ({ weeks, monthStart } = buildMonthGrid(year, month1));
  }
  const gridStart = weeks[0][0];
  const gridEnd = weeks[weeks.length - 1][6];

  const [items, tasksNoChecklist, customCategories] = await Promise.all([
    // チェックリスト項目単位で表示(項目の期限を基準にする)
    prisma.checklistItem.findMany({
      where: { dueDate: { gte: gridStart, lte: gridEnd } },
      include: { task: { include: { client: true } } },
      orderBy: { dueDate: "asc" },
    }),
    // チェックリストが無いタスクは、タスク自体の期限で表示(項目として出しようがないため)
    prisma.task.findMany({
      where: { dueDate: { gte: gridStart, lte: gridEnd }, checklist: { none: {} } },
      include: { client: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.taskCategoryDef.findMany({ orderBy: { order: "asc" }, select: { name: true } }),
  ]);

  const categoryColorMap = buildCategoryColorMap(customCategories);

  type CalendarEntry = {
    key: string;
    dueDate: Date;
    taskId: string;
    title: string;
    category: string;
    clientName: string;
    done: boolean;
  };

  const entries: CalendarEntry[] = [
    ...items
      .filter((i) => i.dueDate !== null)
      .map((i) => ({
        key: `item-${i.id}`,
        dueDate: i.dueDate as Date,
        taskId: i.taskId,
        title: i.title,
        category: i.task.category,
        clientName: i.task.client.name,
        done: i.done,
      })),
    ...tasksNoChecklist
      .filter((t) => t.dueDate !== null)
      .map((t) => ({
        key: `task-${t.id}`,
        dueDate: t.dueDate as Date,
        taskId: t.id,
        title: t.title,
        category: t.category,
        clientName: t.client.name,
        done: t.status === "DONE",
      })),
  ].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const entriesByDay = new Map<string, CalendarEntry[]>();
  for (const e of entries) {
    const key = fmt(e.dueDate, "yyyy-MM-dd");
    const list = entriesByDay.get(key) ?? [];
    list.push(e);
    entriesByDay.set(key, list);
  }
  // 日ごとに、消込(完了)済みのものを後ろに回す(未完了優先、同じ完了状態内は期限順を維持)
  for (const list of entriesByDay.values()) {
    list.sort((a, b) => Number(a.done) - Number(b.done));
  }

  const prevMonth = month1 === 1 ? { year: year - 1, month: 12 } : { year, month: month1 - 1 };
  const nextMonth = month1 === 12 ? { year: year + 1, month: 1 } : { year, month: month1 + 1 };
  const prevTwoWeeksStart = fmt(new Date(gridStart.getTime() - 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  const nextTwoWeeksStart = fmt(new Date(gridStart.getTime() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-slate-900">カレンダー</h1>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-slate-300 text-sm">
            <Link
              href="/calendar?view=month"
              className={`px-3 py-1.5 ${
                view === "month" ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              月表示
            </Link>
            <Link
              href="/calendar?view=2weeks"
              className={`px-3 py-1.5 ${
                view === "2weeks" ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              2週間表示
            </Link>
          </div>
          {view === "month" ? (
            <>
              <Link
                href={`/calendar?view=month&year=${prevMonth.year}&month=${prevMonth.month}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                ← 前月
              </Link>
              <span className="text-sm font-semibold text-slate-900">
                {year}年{month1}月
              </span>
              <Link
                href={`/calendar?view=month&year=${nextMonth.year}&month=${nextMonth.month}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                次月 →
              </Link>
            </>
          ) : (
            <>
              <Link
                href={`/calendar?view=2weeks&start=${prevTwoWeeksStart}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                ← 前の2週間
              </Link>
              <span className="text-sm font-semibold text-slate-900">
                {fmt(gridStart, "yyyy/MM/dd")} 〜 {fmt(gridEnd, "yyyy/MM/dd")}
              </span>
              <Link
                href={`/calendar?view=2weeks&start=${nextTwoWeeksStart}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                次の2週間 →
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          入退社
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          給与
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-purple-500" />
          助成金
        </span>
        {customCategories.map((c) => (
          <span key={c.name} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${categoryColor(categoryColorMap, c.name).dot}`} />
            {c.name}
          </span>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-semibold text-slate-500">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {weeks.flat().map((day) => {
              const key = fmt(day, "yyyy-MM-dd");
              const dayEntries = entriesByDay.get(key) ?? [];
              const inMonth = monthStart ? isSameMonth(day, monthStart) : true;
              const today = isToday(day);
              return (
                <div
                  key={key}
                  className={`min-h-[100px] border-b border-r border-slate-100 p-1.5 ${
                    inMonth ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-xs ${
                      today
                        ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white"
                        : inMonth
                        ? "text-slate-700"
                        : "text-slate-300"
                    }`}
                  >
                    {fmt(day, "d")}
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {dayEntries.slice(0, 3).map((e) => (
                      <Link
                        key={e.key}
                        href={`/tasks/${e.taskId}`}
                        className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100"
                        title={`${categoryLabel(e.category)}: ${e.title} (${e.clientName})`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${categoryColor(categoryColorMap, e.category).dot}`}
                        />
                        <span className={`truncate ${e.done ? "line-through text-slate-400" : ""}`}>{e.title}</span>
                      </Link>
                    ))}
                    {dayEntries.length > 3 && (
                      <p className="px-1 text-[10px] text-slate-400">+{dayEntries.length - 3}件</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
