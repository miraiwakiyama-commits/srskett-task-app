"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TASK_STATUS_ORDER, statusLabel } from "@/lib/constants";

type Client = { id: string; name: string };
type CustomCategory = { name: string };

export default function TaskFilterBar({
  clients,
  customCategories,
  initialCategory,
  initialStatus,
  initialClientId,
  initialQ,
}: {
  clients: Client[];
  customCategories: CustomCategory[];
  initialCategory: string;
  initialStatus: string[];
  initialClientId: string;
  initialQ: string;
}) {
  const router = useRouter();

  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState<string[]>(initialStatus);
  const [clientId, setClientId] = useState(initialClientId);
  const [q, setQ] = useState(initialQ);
  const isFirstRender = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushFilters(next: { category: string; status: string[]; clientId: string; q: string }) {
    const qs = new URLSearchParams();
    if (next.category) qs.set("category", next.category);
    for (const s of next.status) qs.append("status", s);
    if (next.clientId) qs.set("clientId", next.clientId);
    if (next.q) qs.set("q", next.q);
    const qsString = qs.toString();
    router.replace(qsString ? `/tasks?${qsString}` : "/tasks", { scroll: false });
  }

  // カテゴリ・ステータス・クライアントは即時反映
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    pushFilters({ category, status, clientId, q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status, clientId]);

  // キーワード検索は入力が落ち着いてから反映(デバウンス)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushFilters({ category, status, clientId, q });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function toggleStatus(s: string) {
    setStatus((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      >
        <option value="">全種別</option>
        <option value="HR">入退社</option>
        <option value="PAYROLL">給与</option>
        <option value="GRANT">助成金</option>
        {customCategories.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-300 px-2 py-1.5">
        <span className="text-xs text-slate-400">ステータス:</span>
        {TASK_STATUS_ORDER.map((s) => (
          <label key={s} className="flex items-center gap-1 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={status.includes(s)}
              onChange={() => toggleStatus(s)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            {statusLabel(s)}
          </label>
        ))}
      </div>
      <select
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      >
        <option value="">全クライアント</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="タイトル検索"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
    </div>
  );
}
