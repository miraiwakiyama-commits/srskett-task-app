import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { categoryLabel, subTypeLabel, DUE_BASIS_LABELS } from "@/lib/constants";
import { titleTemplatePlaceholderHelp } from "@/lib/titleTemplate";
import {
  updateTemplate,
  toggleTemplateActive,
  deleteTemplate,
  addTemplateItem,
  updateTemplateItem,
  deleteTemplateItem,
} from "@/lib/actions/templates";

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await prisma.taskTemplate.findUnique({
    where: { id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!template) notFound();

  const updateAction = updateTemplate.bind(null, template.id);
  const toggleActiveAction = toggleTemplateActive.bind(null, template.id, !template.isActive);
  const deleteTemplateAction = deleteTemplate.bind(null, template.id);
  const addItemAction = addTemplateItem.bind(null, template.id);

  return (
    <div className="max-w-2xl">
      <p className="text-xs text-slate-400">
        {categoryLabel(template.category)} / {subTypeLabel(template.category, template.subType)}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">{template.name}</h1>
        <form action={toggleActiveAction}>
          <button
            type="submit"
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
              template.isActive
                ? "bg-emerald-100 text-emerald-700 ring-emerald-300"
                : "bg-slate-100 text-slate-500 ring-slate-300"
            }`}
          >
            {template.isActive ? "有効" : "無効"}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <form action={updateAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">テンプレート名</label>
            <input
              name="name"
              defaultValue={template.name}
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">説明</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={template.description ?? ""}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {template.category !== "HR" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">起算日の内容</label>
              <input
                name="baseDateLabel"
                defaultValue={template.baseDateLabel}
                placeholder="例: 支給決定日、契約更新日"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                「何を起算日とするか」の説明です。新規タスク作成時に案内文として表示されます。
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700">タスク名の付け方</label>
            <input
              name="titleTemplate"
              defaultValue={template.titleTemplate ?? ""}
              placeholder="例: {client} {subType}申請"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              未入力の場合は種別ごとの既定の命名規則を使用します。使用できる項目: {titleTemplatePlaceholderHelp(template.category)}
            </p>
          </div>
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            保存
          </button>
        </form>
      </div>

      <section className="mt-8">
        <h2 className="text-base font-bold text-slate-900">チェックリスト項目</h2>
        <p className="mt-1 text-xs text-slate-500">
          {template.category === "HR"
            ? "入社日/退社日からのオフセット日数で提出期限が自動算出されます。"
            : `起算日(${template.baseDateLabel})からのオフセット日数で提出期限が自動算出されます。`}
        </p>
        <div className="mt-3 space-y-2">
          {template.items.map((item) => {
            const itemAction = updateTemplateItem.bind(null, template.id, item.id);
            const deleteItemAction = deleteTemplateItem.bind(null, template.id, item.id);
            return (
              <form
                key={item.id}
                action={itemAction}
                className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="min-w-[10rem] flex-1">
                  <label className="block text-xs text-slate-500">項目名</label>
                  <input
                    name="title"
                    defaultValue={item.title}
                    required
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {template.category === "HR" && (
                  <div>
                    <label className="block text-xs text-slate-500">起算日基準</label>
                    <select
                      name="dueBasis"
                      defaultValue={item.dueBasis}
                      className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="HIRE_DATE">{DUE_BASIS_LABELS.HIRE_DATE}</option>
                      <option value="RESIGN_DATE">{DUE_BASIS_LABELS.RESIGN_DATE}</option>
                    </select>
                  </div>
                )}
                {template.category !== "HR" && <input type="hidden" name="dueBasis" value="TASK_CREATED" />}
                <div>
                  <label className="block text-xs text-slate-500">オフセット日数</label>
                  <input
                    type="number"
                    name="dueOffsetDays"
                    defaultValue={item.dueOffsetDays}
                    className="mt-1 w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button type="submit" className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
                  保存
                </button>
                <button
                  type="submit"
                  formAction={deleteItemAction}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </form>
            );
          })}
          {template.items.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
              チェックリスト項目がありません
            </p>
          )}
        </div>

        <form action={addItemAction} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
          <div className="min-w-[10rem] flex-1">
            <label className="block text-xs text-slate-500">新規項目名</label>
            <input
              name="title"
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {template.category === "HR" ? (
            <div>
              <label className="block text-xs text-slate-500">起算日基準</label>
              <select
                name="dueBasis"
                defaultValue="HIRE_DATE"
                className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="HIRE_DATE">{DUE_BASIS_LABELS.HIRE_DATE}</option>
                <option value="RESIGN_DATE">{DUE_BASIS_LABELS.RESIGN_DATE}</option>
              </select>
            </div>
          ) : (
            <input type="hidden" name="dueBasis" value="TASK_CREATED" />
          )}
          <div>
            <label className="block text-xs text-slate-500">オフセット日数</label>
            <input
              type="number"
              name="dueOffsetDays"
              defaultValue={0}
              className="mt-1 w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button type="submit" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500">
            項目を追加
          </button>
        </form>
      </section>

      <form action={deleteTemplateAction} className="mt-8">
        <button type="submit" className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
          このテンプレートを削除
        </button>
      </form>
    </div>
  );
}
