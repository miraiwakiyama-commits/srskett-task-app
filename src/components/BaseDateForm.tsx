"use client";

export default function BaseDateForm({
  action,
  defaultValue,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValue: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const confirmed = window.confirm(
          "起算日を変更すると、チェックリストとタスクの期限が再計算されます。本当に変更してもよろしいですか？"
        );
        if (!confirmed) {
          e.preventDefault();
        }
      }}
      className="mt-2 flex flex-wrap items-center gap-2"
    >
      <input
        type="date"
        name="baseDate"
        defaultValue={defaultValue}
        required
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <button
        type="submit"
        className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        更新
      </button>
    </form>
  );
}
