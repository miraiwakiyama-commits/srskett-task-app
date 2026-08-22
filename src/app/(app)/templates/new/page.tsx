import NewTemplateForm from "@/components/forms/NewTemplateForm";
import { prisma } from "@/lib/prisma";

export default async function NewTemplatePage() {
  const customCategories = await prisma.taskCategoryDef.findMany({
    orderBy: { order: "asc" },
    select: { name: true },
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-bold text-slate-900">新規テンプレート作成</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <NewTemplateForm customCategories={customCategories} />
      </div>
    </div>
  );
}
