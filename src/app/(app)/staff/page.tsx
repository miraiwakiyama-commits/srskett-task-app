import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/dates";

export default async function StaffPage() {
  const staff = await prisma.staffUser.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { assignedTasks: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">スタッフ管理</h1>
        <Link
          href="/staff/new"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          + 新規スタッフ
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">氏名</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">メールアドレス</th>
              <th className="hidden px-4 py-2 text-left font-semibold text-slate-600 sm:table-cell">権限</th>
              <th className="hidden px-4 py-2 text-left font-semibold text-slate-600 sm:table-cell">担当タスク数</th>
              <th className="hidden px-4 py-2 text-left font-semibold text-slate-600 md:table-cell">登録日</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.email}</td>
                <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                  {s.role === "admin" ? "管理者" : "スタッフ"}
                </td>
                <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{s._count.assignedTasks}</td>
                <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{fmt(s.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/staff/${s.id}/edit`} className="text-xs font-medium text-indigo-700 hover:underline">
                    編集
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
