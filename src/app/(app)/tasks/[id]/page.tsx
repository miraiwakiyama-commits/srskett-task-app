import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/dates";
import { categorySubtitle } from "@/lib/constants";
import StatusSelect from "@/components/StatusSelect";
import ChecklistItemRow from "@/components/ChecklistItemRow";
import ChecklistProgress from "@/components/ChecklistProgress";
import BaseDateForm from "@/components/BaseDateForm";
import { MascotBubble, randomCheerMessage } from "@/components/Mascot";
import { buildCategoryColorMap, categoryColor } from "@/lib/categoryColors";
import {
  addChecklistItem,
  addNote,
  addAttachmentLink,
  deleteAttachment,
  deleteTask,
  updateTaskBaseDate,
} from "@/lib/actions/tasks";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [task, customCategories] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      include: {
        client: true,
        assignee: true,
        checklist: { orderBy: { order: "asc" } },
        notes: { orderBy: { createdAt: "desc" }, include: { author: true } },
        attachments: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.taskCategoryDef.findMany({ orderBy: { order: "asc" }, select: { name: true } }),
  ]);
  if (!task) notFound();

  const color = categoryColor(buildCategoryColorMap(customCategories), task.category);
  const doneCount = task.checklist.filter((i) => i.done).length;
  const hasUncheckedItems = task.checklist.some((i) => !i.done);
  const addChecklistItemAction = addChecklistItem.bind(null, task.id);
  const addNoteAction = addNote.bind(null, task.id);
  const addAttachmentLinkAction = addAttachmentLink.bind(null, task.id);
  const deleteAttachmentAction = deleteAttachment.bind(null, task.id);
  const deleteTaskAction = deleteTask.bind(null, task.id);
  const updateBaseDateAction = updateTaskBaseDate.bind(null, task.id);

  return (
    <div className={`max-w-3xl rounded-xl border ${color.border} ${color.bg} p-4 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">
            {categorySubtitle(task.category, task.subType)}
          </p>
          <h1 className="mt-1 text-lg font-bold text-slate-900">{task.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            <Link href={`/clients/${task.client.id}`} className="text-indigo-700 hover:underline">
              {task.client.name}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusSelect taskId={task.id} status={task.status} hasUncheckedItems={hasUncheckedItems} />
          <Link
            href={`/tasks/${task.id}/edit`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            編集
          </Link>
        </div>
      </div>

      {task.status === "DONE" && (
        <MascotBubble message={randomCheerMessage()} className="mt-4" />
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard label="期限" value={fmt(task.dueDate) || "未設定"} />
        <InfoCard label="担当者" value={task.assignee?.name ?? "未割当"} />
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">チェックリスト進捗</p>
          <div className="mt-2">
            <ChecklistProgress done={doneCount} total={task.checklist.length} />
          </div>
        </div>
      </div>

      {task.baseDate && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">{task.baseDateLabel || "起算日"}</p>
          <BaseDateForm action={updateBaseDateAction} defaultValue={fmt(task.baseDate, "yyyy-MM-dd")} />
          <p className="mt-1 text-xs text-slate-400">
            起算日を変更すると、テンプレートから生成されたチェックリストの期限とタスクの期限が自動的に再計算されます。
          </p>
        </div>
      )}

      {task.description && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 whitespace-pre-wrap">
          {task.description}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-base font-bold text-slate-900">チェックリスト</h2>
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <ul className="divide-y divide-slate-100">
            {task.checklist.map((item) => (
              <ChecklistItemRow key={item.id} taskId={task.id} item={item} colorBg={color.bg} />
            ))}
            {task.checklist.length === 0 && (
              <li className="py-4 text-center text-sm text-slate-400">チェックリスト項目はありません</li>
            )}
          </ul>
          <form action={addChecklistItemAction} className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <input
              name="title"
              placeholder="項目を追加"
              required
              className="min-w-[10rem] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="date"
              name="dueDate"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button type="submit" className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
              追加
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-bold text-slate-900">関連リンク</h2>
        <p className="mt-1 text-xs text-slate-500">Googleドライブ等の共有リンクを貼り付けて、資料を紐付けられます。</p>
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <ul className="divide-y divide-slate-100">
            {task.attachments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-indigo-700 hover:underline"
                >
                  {a.label || a.url}
                </a>
                <form action={deleteAttachmentAction.bind(null, a.id)}>
                  <button type="submit" className="shrink-0 text-xs text-slate-400 hover:text-red-600">
                    削除
                  </button>
                </form>
              </li>
            ))}
            {task.attachments.length === 0 && (
              <li className="py-4 text-center text-sm text-slate-400">関連リンクはありません</li>
            )}
          </ul>
          <form action={addAttachmentLinkAction} className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <input
              name="label"
              placeholder="リンク名(任意)"
              className="w-40 rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="url"
              name="url"
              placeholder="https://drive.google.com/..."
              required
              className="min-w-[14rem] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button type="submit" className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
              追加
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-bold text-slate-900">メモ・コメント</h2>
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <form action={addNoteAction} className="flex flex-col gap-2">
            <textarea
              name="body"
              rows={2}
              required
              placeholder="メモを追加"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button type="submit" className="self-start rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
              投稿
            </button>
          </form>
          <ul className="mt-4 space-y-3 border-t border-slate-100 pt-3">
            {task.notes.map((n) => (
              <li key={n.id} className="text-sm">
                <p className="text-slate-700 whitespace-pre-wrap">{n.body}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {n.author?.name ?? "スタッフ"} ・ {fmt(n.createdAt, "yyyy/MM/dd HH:mm")}
                </p>
              </li>
            ))}
            {task.notes.length === 0 && <li className="text-sm text-slate-400">メモはまだありません</li>}
          </ul>
        </div>
      </section>

      <form action={deleteTaskAction} className="mt-8">
        <button type="submit" className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
          このタスクを削除
        </button>
      </form>
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
