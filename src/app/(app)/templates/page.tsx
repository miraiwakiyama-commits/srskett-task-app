import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { categoryLabel, subTypeLabel } from "@/lib/constants";
import PayrollGeneratePanel from "@/components/PayrollGeneratePanel";
import CategoryManagePanel from "@/components/CategoryManagePanel";

export default async function TemplatesPage() {
  const [templates, customCategories] = await Promise.all([
    prisma.taskTemplate.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: { _count: { select: { items: true } } },
    }),
    prisma.taskCategoryDef.findMany({ orderBy: { order: "asc" } }),
  ]);

  const groups: Record<string, typeof templates> = { HR: [], PAYROLL: [], GRANT: [] };
  for (const t of templates) {
    (groups[t.category] ??= []).push(t);
  }

  const categoryOrder = ["HR", "PAYROLL", "GRANT", ...customCategories.map((c) => c.name)];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">テンプレート管理</h1>
        <Link
          href="/templates/new"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          + 新規テンプレート
        </Link>
      </div>

      <PayrollGeneratePanel />
      <CategoryManagePanel categories={customCategories} />

      {categoryOrder.map((cat) => (
        <section key={cat} className="mt-8">
          <h2 className="text-base font-bold text-slate-900">{categoryLabel(cat)}テンプレート</h2>
          <div className="mt-3 space-y-2">
            {(groups[cat] ?? []).map((t) => (
              <Link
                key={t.id}
                href={`/templates/${t.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-indigo-300"
              >
                <div>
                  <p className="text-xs text-slate-400">{subTypeLabel(t.category, t.subType)}</p>
                  <p className="text-sm font-medium text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t._count.items}項目</p>
                </div>
                {!t.isActive && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">無効</span>
                )}
              </Link>
            ))}
            {(!groups[cat] || groups[cat].length === 0) && (
              <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
                テンプレートがありません
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
