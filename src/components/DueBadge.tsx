import { daysUntil, fmt } from "@/lib/dates";

export default function DueBadge({ dueDate, status }: { dueDate: string | Date | null; status?: string }) {
  if (!dueDate) return <span className="text-xs text-slate-400">期限なし</span>;
  const days = daysUntil(dueDate);
  const done = status === "DONE";

  let cls = "text-slate-600";
  let label = fmt(dueDate);
  if (!done && days !== null) {
    if (days < 0) {
      cls = "text-red-700 font-semibold";
      label = `${fmt(dueDate)}(${Math.abs(days)}日超過)`;
    } else if (days <= 3) {
      cls = "text-amber-700 font-semibold";
      label = `${fmt(dueDate)}(あと${days}日)`;
    }
  }

  return <span className={`text-xs ${cls}`}>{label}</span>;
}
