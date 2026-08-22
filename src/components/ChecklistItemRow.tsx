"use client";

import { useTransition } from "react";
import { fmt } from "@/lib/dates";
import { toggleChecklistItem, deleteChecklistItem } from "@/lib/actions/tasks";

export default function ChecklistItemRow({
  taskId,
  item,
  colorBg,
}: {
  taskId: string;
  item: { id: string; title: string; done: boolean; dueDate: Date | string | null };
  colorBg?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className={`flex items-center justify-between gap-2 rounded-md px-2 py-2 ${colorBg ?? ""}`}>
      <label className="flex flex-1 items-center gap-2">
        <input
          type="checkbox"
          defaultChecked={item.done}
          disabled={isPending}
          onChange={(e) => {
            const checked = e.target.checked;
            startTransition(() => {
              toggleChecklistItem(taskId, item.id, checked);
            });
          }}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className={`text-sm ${item.done ? "text-slate-400 line-through" : "text-slate-800"}`}>
          {item.title}
        </span>
        {item.dueDate && <span className="text-xs text-slate-400">期限: {fmt(item.dueDate)}</span>}
      </label>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => deleteChecklistItem(taskId, item.id))}
        className="text-xs text-slate-400 hover:text-red-600"
      >
        削除
      </button>
    </li>
  );
}
