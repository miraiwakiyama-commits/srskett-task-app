"use client";

import { useState } from "react";

type ClientFormValues = {
  clientNumber: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  plan: string;
  notes: string;
  hasPayroll: boolean;
  payrollClosingDay: string;
  payrollPayDay: string;
  payrollPayMonthOffset: string;
};

const DEFAULTS: ClientFormValues = {
  clientNumber: "",
  name: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  plan: "",
  notes: "",
  hasPayroll: true,
  payrollClosingDay: "",
  payrollPayDay: "",
  payrollPayMonthOffset: "1",
};

export default function ClientForm({
  action,
  defaultValues,
  submitLabel = "保存",
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: Partial<ClientFormValues>;
  submitLabel?: string;
}) {
  const values = { ...DEFAULTS, ...defaultValues };
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action={action}
      onSubmit={() => setSubmitting(true)}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">企業名 *</label>
          <input
            name="name"
            required
            defaultValue={values.name}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">番号</label>
          <input
            name="clientNumber"
            defaultValue={values.clientNumber}
            placeholder="例: A-001"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">担当者名</label>
          <input
            name="contactName"
            defaultValue={values.contactName}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">契約プラン</label>
          <input
            name="plan"
            defaultValue={values.plan}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">連絡先メール</label>
          <input
            type="email"
            name="contactEmail"
            defaultValue={values.contactEmail}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">連絡先電話番号</label>
          <input
            name="contactPhone"
            defaultValue={values.contactPhone}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-900">給与マスタ設定</h3>
        <p className="mt-1 text-xs text-slate-500">
          締め日・支払日は「給与計算あり」の設定に関わらず入力できます。月次給与タスクの一括生成は「給与計算あり」にチェックが入っているクライアントのみが対象です。
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="hasPayroll"
            defaultChecked={values.hasPayroll}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          給与計算あり
        </label>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">締め日(1-31)</label>
            <input
              type="number"
              min={1}
              max={31}
              name="payrollClosingDay"
              defaultValue={values.payrollClosingDay}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">支払日(1-31)</label>
            <input
              type="number"
              min={1}
              max={31}
              name="payrollPayDay"
              defaultValue={values.payrollPayDay}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">支払月</label>
            <select
              name="payrollPayMonthOffset"
              defaultValue={values.payrollPayMonthOffset}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="0">当月払い</option>
              <option value="1">翌月払い</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">備考</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={values.notes}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
      >
        {submitting ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
