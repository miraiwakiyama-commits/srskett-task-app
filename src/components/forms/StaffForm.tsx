"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";

type StaffFormValues = {
  name: string;
  email: string;
  role: string;
};

const DEFAULTS: StaffFormValues = { name: "", email: "", role: "staff" };

export default function StaffForm({
  action,
  defaultValues,
  submitLabel = "保存",
  passwordRequired = true,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: Partial<StaffFormValues>;
  submitLabel?: string;
  passwordRequired?: boolean;
}) {
  const values = { ...DEFAULTS, ...defaultValues };
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setError(null);
        setSubmitting(true);
        try {
          await action(formData);
        } catch (e) {
          unstable_rethrow(e);
          setError(e instanceof Error ? e.message : "エラーが発生しました");
          setSubmitting(false);
        }
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700">氏名 *</label>
        <input
          name="name"
          required
          defaultValue={values.name}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">メールアドレス *</label>
        <input
          type="email"
          name="email"
          required
          defaultValue={values.email}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">権限</label>
        <select
          name="role"
          defaultValue={values.role}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="staff">スタッフ</option>
          <option value="admin">管理者</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          パスワード {passwordRequired ? "*" : "(変更する場合のみ入力)"}
        </label>
        <input
          type="password"
          name="password"
          required={passwordRequired}
          minLength={8}
          placeholder={passwordRequired ? "" : "変更しない場合は空欄"}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-slate-400">8文字以上</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
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
