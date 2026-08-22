export default function ChecklistProgress({
  done,
  total,
  size = "md",
}: {
  done: number;
  total: number;
  size?: "sm" | "md";
}) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const barHeight = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={size === "sm" ? "w-24" : "w-40"}>
      <div className="flex items-center justify-between">
        <span className={size === "sm" ? "text-[11px] text-slate-500" : "text-xs text-slate-500"}>
          {total > 0 ? `${done} / ${total}` : "項目なし"}
        </span>
        {total > 0 && (
          <span className={size === "sm" ? "text-[11px] font-semibold text-slate-700" : "text-xs font-semibold text-slate-700"}>
            {percent}%
          </span>
        )}
      </div>
      <div className={`mt-0.5 w-full overflow-hidden rounded-full bg-slate-100 ${barHeight}`}>
        <div
          className={`h-full rounded-full transition-all ${
            percent === 100 ? "bg-emerald-500" : "bg-indigo-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
