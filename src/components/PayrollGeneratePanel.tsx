"use client";

import { useState, useTransition } from "react";
import { runGenerateMonthlyPayroll } from "@/lib/actions/tasks";

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function PayrollGeneratePanel() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleGenerate() {
    const [yearStr, monthStr] = yearMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    startTransition(async () => {
      const created = await runGenerateMonthlyPayroll(year, month);
      setResult(
        created.length > 0
          ? `${created.length}件の月次給与タスクを生成しました`
          : "対象クライアントの当月分タスクは既に生成済みか、「給与計算あり」が未チェックか締め日/支払日が未設定です"
      );
    });
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">月次給与タスクの一括生成</h3>
      <p className="mt-1 text-xs text-slate-500">
        「給与計算あり」にチェックが入っており、締め日/支払日が設定されたクライアントについて、指定月分の給与計算タスクをまとめて作成します(既存分はスキップされます)。
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="month"
          value={yearMonth}
          onChange={(e) => setYearMonth(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={handleGenerate}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {isPending ? "生成中..." : "生成する"}
        </button>
        {result && <span className="text-xs text-slate-500">{result}</span>}
      </div>
    </div>
  );
}
