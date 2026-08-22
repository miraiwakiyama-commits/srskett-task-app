import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { categorySubtitle } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import DueBadge from "@/components/DueBadge";
import ChecklistProgress from "@/components/ChecklistProgress";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
        include: { assignee: true, checklist: { select: { done: true } } },
      },
    },
  });
  if (!client) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{client.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{client.plan ?? "契約プラン未設定"}</p>
        </div>
        <Link
          href={`/clients/${client.id}/edit`}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          編集
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="担当者" value={client.contactName ?? "-"} />
        <InfoCard label="連絡先メール" value={client.contactEmail ?? "-"} />
        <InfoCard label="連絡先電話" value={client.contactPhone ?? "-"} />
        <InfoCard
          label="給与 締め日/支払日"
          value={
            client.payrollClosingDay && client.payrollPayDay
              ? `${client.payrollClosingDay}日締め / ${client.payrollPayDay}日払い(${
                  client.payrollPayMonthOffset === 0 ? "当月" : "翌月"
                })`
              : "未設定"
          }
        />
      </div>

      <div className="mt-4">
        {client.hasPayroll ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            給与計算あり(月次一括生成の対象)
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            給与計算なし(月次一括生成の対象外)
          </span>
        )}
      </div>

      {client.notes && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          {client.notes}
        </div>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">タスク ({client.tasks.length}件)</h2>
          <Link
            href={`/tasks/new?clientId=${client.id}`}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            + タスクを追加
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {client.tasks.map((t) => (
            <Link
              key={t.id}
              href={`/tasks/${t.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-indigo-300"
            >
              <div>
                <p className="text-xs text-slate-400">
                  {categorySubtitle(t.category, t.subType)}
                </p>
                <p className="text-sm font-medium text-slate-900">{t.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <ChecklistProgress
                  done={t.checklist.filter((i) => i.done).length}
                  total={t.checklist.length}
                  size="sm"
                />
                <DueBadge dueDate={t.dueDate} status={t.status} />
                <StatusBadge status={t.status} />
              </div>
            </Link>
          ))}
          {client.tasks.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
              タスクがありません
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
