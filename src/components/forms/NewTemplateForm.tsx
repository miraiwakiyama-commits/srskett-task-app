"use client";

import { useState } from "react";
import { createTemplate } from "@/lib/actions/templates";
import { titleTemplatePlaceholderHelp } from "@/lib/titleTemplate";

export default function NewTemplateForm({ customCategories }: { customCategories: { name: string }[] }) {
  const [category, setCategory] = useState<string>("HR");
  const [submitting, setSubmitting] = useState(false);

  const isFreeTextSubType = category !== "HR" && category !== "PAYROLL";

  return (
    <form action={createTemplate} onSubmit={() => setSubmitting(true)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">カテゴリ *</label>
        <select
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="HR">入退社</option>
          <option value="PAYROLL">給与</option>
          <option value="GRANT">助成金</option>
          {customCategories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">サブ種別 *</label>
        {isFreeTextSubType ? (
          <input
            name="subType"
            required
            placeholder={category === "GRANT" ? "例: キャリアアップ助成金" : "例: 就業規則改定"}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        ) : (
          <select
            name="subType"
            required
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {category === "HR" ? (
              <>
                <option value="ONBOARDING">入社</option>
                <option value="OFFBOARDING">退社</option>
              </>
            ) : (
              <>
                <option value="MONTHLY">月次給与計算</option>
                <option value="YEAREND">年末調整</option>
                <option value="BONUS">賞与計算</option>
                <option value="OTHER">その他</option>
              </>
            )}
          </select>
        )}
      </div>

      {category !== "HR" && (
        <div>
          <label className="block text-sm font-medium text-slate-700">起算日の内容</label>
          <input
            name="baseDateLabel"
            defaultValue="起算日"
            placeholder="例: 支給決定日、契約更新日"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-slate-400">
            このテンプレートで「何を起算日とするか」の説明です。新規タスク作成時に案内文として表示され、各チェックリスト項目の期限はこの日付からのオフセット日数で自動算出されます。
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">テンプレート名 *</label>
        <input
          name="name"
          required
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">タスク名の付け方</label>
        <input
          name="titleTemplate"
          placeholder="例: {client} {subType}申請"
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-slate-400">
          未入力の場合は種別ごとの既定の命名規則を使用します。使用できる項目: {titleTemplatePlaceholderHelp(category)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">説明</label>
        <textarea
          name="description"
          rows={2}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <p className="text-xs text-slate-400">作成後、詳細画面からチェックリスト項目(期限の起算日・オフセット日数)を追加できます。</p>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
      >
        {submitting ? "作成中..." : "作成する"}
      </button>
    </form>
  );
}
