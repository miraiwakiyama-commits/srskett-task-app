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
        const parts = [`新規登録 ${summary.created}件`, `更新 ${summary.updated}件`];
        if (summary.skipped > 0) parts.push(`スキップ ${summary.skipped}件`);
        setResult(parts.join(" / "));
        formRef.current?.reset();
      } catch (err) {
        unstable_rethrow(err);
        setError(err instanceof Error ? err.message : "インポートに失敗しました");
      }
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">顧問先のCSV一括登録・編集</h3>
        <a
          href="/api/clients/export"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          現在の顧問先をCSVで出力
        </a>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        1行目は見出し行にしてください。認識する列: ID・番号・企業名(必須)・担当者名・担当者メール・担当者電話・プラン・メモ・給与計算あり・締め日・支払日・支払月オフセット・アーカイブ
      </p>
      <p className="mt-1 text-xs text-slate-500">
        出力したCSVを編集してそのまま読み込ませると、ID列をもとに既存の顧問先情報が更新されます(ID列は削除・変更しないでください)。ID列が空欄の行は新規登録されます。
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
