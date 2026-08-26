"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { importClientsFromCsv } from "@/lib/actions/clients";

export default function ClientCsvImportForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const summary = await importClientsFromCsv(formData);
        setResult(
          `${summary.created}件登録しました。${
            summary.skipped > 0 ? `${summary.skipped}件は企業名が空欄のためスキップしました。` : ""
          }`
        );
        formRef.current?.reset();
      } catch (err) {
        unstable_rethrow(err);
        setError(err instanceof Error ? err.message : "インポートに失敗しました");
      }
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">顧問先をCSVから一括登録</h3>
      <p className="mt-1 text-xs text-slate-500">
        1行目は見出し行にしてください。認識する列: 番号・企業名(必須)・担当者名・担当者メール・担当者電話・プラン・メモ・給与計算あり・締め日・支払日・支払月オフセット
      </p>
      <form ref={formRef} onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isPending ? "取り込み中..." : "インポート"}
        </button>
      </form>
      {result && <p className="mt-2 text-sm text-emerald-700">{result}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
