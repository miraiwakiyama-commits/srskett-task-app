"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { createCategory, deleteCategory } from "@/lib/actions/categories";

type Category = { id: string; name: string };

export default function CategoryManagePanel({ categories }: { categories: Category[] }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("name", name);
      await createCategory(fd);
      setName("");
    } catch (err) {
      unstable_rethrow(err);
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(categoryId: string) {
    startDeleteTransition(async () => {
      try {
        await deleteCategory(categoryId);
      } catch (err) {
        unstable_rethrow(err);
        window.alert(err instanceof Error ? err.message : "エラーが発生しました");
      }
    });
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">カスタム種別の管理</h3>
      <p className="mt-1 text-xs text-slate-500">
        入退社・給与・助成金以外のタスク種別を追加できます。追加した種別は新規タスク作成・テンプレート作成で選択できるようになります。
      </p>

      {categories.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs font-medium text-slate-700"
            >
              {c.name}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(c.id)}
                className="rounded-full px-1 text-slate-400 hover:bg-slate-200 hover:text-red-600 disabled:opacity-50"
                aria-label={`${c.name}を削除`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-3 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 労務相談"
          required
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          + 種別を追加
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
