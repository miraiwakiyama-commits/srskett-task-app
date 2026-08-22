"use client";

import { useTransition } from "react";
import { TASK_STATUS_ORDER, statusLabel } from "@/lib/constants";
import { updateTaskStatus } from "@/lib/actions/tasks";

export default function StatusSelect({
  taskId,
  status,
  hasUncheckedItems,
}: {
  taskId: string;
  status: string;
  hasUncheckedItems: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      key={status}
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value;
        if (next === "DONE" && hasUncheckedItems) {
          const confirmed = window.confirm(
            "未チェックのチェックリストがあります。一括でチェックをし、完了にしますか？"
          );
          if (!confirmed) {
            e.target.value = status;
            return;
          }
        }
        startTransition(() => {
          updateTaskStatus(taskId, next);
        });
      }}
      className="rounded-md border border-slate-300 px-2 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
    >
      {TASK_STATUS_ORDER.map((s) => (
        <option key={s} value={s}>
          {statusLabel(s)}
        </option>
      ))}
    </select>
  );
}
