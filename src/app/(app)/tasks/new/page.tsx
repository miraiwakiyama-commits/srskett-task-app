import TaskWizard from "@/components/forms/TaskWizard";
import { prisma } from "@/lib/prisma";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const sp = await searchParams;
  const [clients, staff, templates, customCategories] = await Promise.all([
    prisma.client.findMany({
      where: { archived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.staffUser.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.taskTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true, subType: true, baseDateLabel: true, titleTemplate: true },
    }),
    prisma.taskCategoryDef.findMany({ orderBy: { order: "asc" }, select: { name: true } }),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold text-slate-900">新規タスク作成</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <TaskWizard
          clients={clients}
          staff={staff}
          templates={templates}
          customCategories={customCategories}
          defaultClientId={sp.clientId}
        />
      </div>
    </div>
  );
}
