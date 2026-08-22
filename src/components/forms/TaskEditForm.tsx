"use client";

import { useState } from "react";
import { TASK_STATUS_ORDER, statusLabel } from "@/lib/constants";
import { fmt } from "@/lib/dates";

type Client = { id: string; name: string };
type Staff = { id: string; name: string };

type Task = {
  id: string;
  title: string;
  description: string | null;
  clientId: string;
  assigneeId: string | null;
  dueDate: Date | string | null;
  status: string;
};

export default function TaskEditForm({
  task,
  clients,
  staff,
  hasUncheckedItems,
  action,
}: {
  task: Task;
  clients: Client[];
  staff: Staff[];
  hasUncheckedItems: boolean;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(task.status);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (status === "DONE" && hasUncheckedItems) {
          const confirmed = window.confirm(
            "未チェックのチェックリストがあります。一括でチェックをし、完了にしますか？"
          );
          if (!confirmed) {
            e.preventDefault();
            return;
          }
        }
        setSubmitting(true);
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700">タイトル *</label>
        <input
          name="title"
          required
          defaultValue={task.title}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">クライアント *</label>
        <select
          name="clientId"
          required
          defaultValue={task.clientId}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">期限</label>
          <input
            type="date"
            name="dueDate"
            defaultValue={task.dueDate ? fmt(task.dueDate, "yyyy-MM-dd") : ""}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">担当者</label>
          <select
            name="assigneeId"
            defaultValue={task.assigneeId ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">未割当</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">ステータス</label>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {TASK_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        {status === "DONE" && hasUncheckedItems && (
          <p className="mt-1 text-xs text-amber-600">
            未チェックのチェックリストがあります。保存すると確認のうえ一括チェックされます。
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">メモ</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={task.description ?? ""}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
      >
        {submitting ? "保存中..." : "更新する"}
      </button>
    </form>
  );
}
