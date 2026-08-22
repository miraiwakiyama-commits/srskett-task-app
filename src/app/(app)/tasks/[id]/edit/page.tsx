import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TaskEditForm from "@/components/forms/TaskEditForm";
import { updateTask } from "@/lib/actions/tasks";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [task, clients, staff, uncheckedCount] = await Promise.all([
    prisma.task.findUnique({ where: { id } }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.staffUser.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.checklistItem.count({ where: { taskId: id, done: false } }),
  ]);
  if (!task) notFound();

  const action = updateTask.bind(null, task.id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold text-slate-900">タスクの編集</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <TaskEditForm
          task={task}
          clients={clients}
          staff={staff}
          hasUncheckedItems={uncheckedCount > 0}
          action={action}
        />
      </div>
    </div>
  );
}
