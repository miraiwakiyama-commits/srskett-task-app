import { TASK_STATUS_BADGE_CLASS, statusLabel } from "@/lib/constants";

export default function StatusBadge({ status }: { status: string }) {
  const cls = TASK_STATUS_BADGE_CLASS[status as keyof typeof TASK_STATUS_BADGE_CLASS] ?? "bg-slate-100 text-slate-700 ring-slate-300";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {statusLabel(status)}
    </span>
  );
}
