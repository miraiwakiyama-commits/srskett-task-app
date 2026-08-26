import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ClientCsvImportForm from "@/components/ClientCsvImportForm";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      tasks: { where: { status: { not: "DONE" } }, select: { id: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">クライアント</h1>
        <Link
          href="/clients/new"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          + 新規クライアント
        </Link>
      </div>

      <div className="mt-6">
        <ClientCsvImportForm />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">企業名</th>
              <th className="hidden px-4 py-2 text-left font-semibold text-slate-600 sm:table-cell">担当者</th>
              <th className="hidden px-4 py-2 text-left font-semibold text-slate-600 md:table-cell">契約プラン</th>
              <th className="hidden px-4 py-2 text-left font-semibold text-slate-600 sm:table-cell">給与計算</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">未完了タスク</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/clients/${c.id}`} className="font-medium text-indigo-700 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{c.contactName ?? "-"}</td>
                <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{c.plan ?? "-"}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {c.hasPayroll ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      あり
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">なし</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      c.tasks.length > 0
                        ? "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                        : "text-xs text-slate-400"
                    }
                  >
                    {c.tasks.length > 0 ? `${c.tasks.length}件` : "なし"}
                  </span>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  クライアントが登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
