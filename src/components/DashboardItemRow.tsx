"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toggleChecklistItem } from "@/lib/actions/tasks";
import { categorySubtitle } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import DueBadge from "@/components/DueBadge";

export type DashboardRow =
  | {
      kind: "item";
      key: string;
      dueDate: Date | string | null;
      itemId: string;
      itemTitle: string;
      taskId: string;
      taskTitle: string;
      taskStatus: string;
      category: string;
      subType: string;
      clientName: string;
      assigneeName: string | null;
      colorBg: string;
      colorBorder: string;
    }
  | {
      kind: "task";
      key: string;
      dueDate: Date | string | null;
      taskId: string;
      taskTitle: string;
      taskStatus: string;
      category: string;
      subType: string;
      clientName: string;
      assigneeName: string | null;
      colorBg: string;
      colorBorder: string;
    };

export default function DashboardItemRow({ row }: { row: DashboardRow }) {
  const [isPending, startTransition] = useTransition();

  if (row.kind === "task") {
    return (
      <Link
        href={`/tasks/${row.taskId}`}
        className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 hover:border-indigo-300 ${row.colorBorder} ${row.colorBg}`}
      >
        <div>
          <p className="text-xs text-slate-400">
            {categorySubtitle(row.category, row.subType)} ・ {row.clientName}
          </p>
          <p className="text-sm font-medium text-slate-900">{row.taskTitle}</p>
          <p className="text-xs text-slate-400">担当: {row.assigneeName ?? "未割当"}</p>
        </div>
        <div className="flex items-center gap-3">
          <DueBadge dueDate={row.dueDate} status={row.taskStatus} />
          <StatusBadge status={row.taskStatus} />
        </div>
      </Link>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 hover:border-indigo-300 ${row.colorBorder} ${row.colorBg}`}
    >
      <div className="flex flex-1 items-start gap-2">
        <input
          type="checkbox"
          disabled={isPending}
          onChange={(e) => {
            const checked = e.target.checked;
            startTransition(() => {
              toggleChecklistItem(row.taskId, row.itemId, checked);
            });
          }}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <Link href={`/tasks/${row.taskId}`} className="min-w-0 flex-1">
          <p className="text-xs text-slate-400">
            {categorySubtitle(row.category, row.subType)} ・ {row.clientName} ・ {row.taskTitle}
          </p>
          <p className="text-sm font-medium text-slate-900">{row.itemTitle}</p>
          <p className="text-xs text-slate-400">担当: {row.assigneeName ?? "未割当"}</p>
        </Link>
      </div>
      <Link href={`/tasks/${row.taskId}`}>
        <DueBadge dueDate={row.dueDate} />
      </Link>
    </div>
  );
}
