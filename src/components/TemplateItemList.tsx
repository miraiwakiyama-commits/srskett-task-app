"use client";

import { useRef, useState, useTransition } from "react";
import { updateTemplateItem, deleteTemplateItem, reorderTemplateItems } from "@/lib/actions/templates";
import { DUE_BASIS_LABELS } from "@/lib/constants";

type Item = {
  id: string;
  title: string;
  dueBasis: string;
  dueOffsetDays: number;
};

export default function TemplateItemList({
  templateId,
  items,
  isHr,
}: {
  templateId: string;
  items: Item[];
  isHr: boolean;
}) {
  const [order, setOrder] = useState(items.map((i) => i.id));
  const [prevItems, setPrevItems] = useState(items);
  const [isPending, startTransition] = useTransition();
  const dragIdRef = useRef<string | null>(null);

  if (items !== prevItems) {
    setPrevItems(items);
    setOrder(items.map((i) => i.id));
  }

  const itemsById = new Map(items.map((i) => [i.id, i]));

  function handleDrop(targetId: string) {
    const draggedId = dragIdRef.current;
    dragIdRef.current = null;
    if (!draggedId || draggedId === targetId) return;
    setOrder((prev) => {
      const next = prev.filter((id) => id !== draggedId);
      const targetIndex = next.indexOf(targetId);
      next.splice(targetIndex, 0, draggedId);
      startTransition(() => {
        reorderTemplateItems(templateId, next);
      });
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
        チェックリスト項目がありません
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${isPending ? "opacity-70" : ""}`}>
      {order.map((id) => {
        const item = itemsById.get(id);
        if (!item) return null;
        const itemAction = updateTemplateItem.bind(null, templateId, item.id);
        const deleteItemAction = deleteTemplateItem.bind(null, templateId, item.id);
        return (
          <div
            key={item.id}
            draggable
            onDragStart={() => {
              dragIdRef.current = item.id;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(item.id)}
            className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3"
          >
            <span
              className="mt-2 shrink-0 cursor-grab select-none text-slate-300 hover:text-slate-500"
              title="ドラッグして並び替え"
              aria-hidden
            >
              ⠿
            </span>
            <form action={itemAction} className="flex flex-1 flex-wrap items-end gap-2">
              <div className="min-w-[10rem] flex-1">
                <label className="block text-xs text-slate-500">項目名</label>
                <input
                  name="title"
                  defaultValue={item.title}
                  required
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              {isHr && (
                <div>
                  <label className="block text-xs text-slate-500">起算日基準</label>
                  <select
                    name="dueBasis"
                    defaultValue={item.dueBasis}
                    className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="HIRE_DATE">{DUE_BASIS_LABELS.HIRE_DATE}</option>
                    <option value="RESIGN_DATE">{DUE_BASIS_LABELS.RESIGN_DATE}</option>
                  </select>
                </div>
              )}
              {!isHr && <input type="hidden" name="dueBasis" value="TASK_CREATED" />}
              <div>
                <label className="block text-xs text-slate-500">オフセット日数</label>
                <input
                  type="number"
                  name="dueOffsetDays"
                  defaultValue={item.dueOffsetDays}
                  className="mt-1 w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                保存
              </button>
              <button
                type="submit"
                formAction={deleteItemAction}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                削除
              </button>
            </form>
          </div>
        );
      })}
    </div>
  );
}
