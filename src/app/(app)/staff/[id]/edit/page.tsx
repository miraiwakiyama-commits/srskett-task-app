import { notFound } from "next/navigation";
import StaffForm from "@/components/forms/StaffForm";
import { updateStaff, deleteStaff } from "@/lib/actions/staff";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [staffMember, session] = await Promise.all([
    prisma.staffUser.findUnique({ where: { id } }),
    getSession(),
  ]);
  if (!staffMember) notFound();

  const action = updateStaff.bind(null, id);
  const removeAction = deleteStaff.bind(null, id);
  const isSelf = session?.userId === id;

  return (
    <div className="max-w-md">
      <h1 className="text-lg font-bold text-slate-900">{staffMember.name} の編集</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <StaffForm
          action={action}
          submitLabel="更新する"
          passwordRequired={false}
          defaultValues={{
            name: staffMember.name,
            email: staffMember.email,
            role: staffMember.role,
          }}
        />
      </div>
      {!isSelf && (
        <form action={removeAction} className="mt-4">
          <button
            type="submit"
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            このスタッフを削除
          </button>
        </form>
      )}
    </div>
  );
}
