import StaffForm from "@/components/forms/StaffForm";
import { createStaff } from "@/lib/actions/staff";

export default function NewStaffPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-lg font-bold text-slate-900">新規スタッフ登録</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <StaffForm action={createStaff} submitLabel="登録する" passwordRequired />
      </div>
    </div>
  );
}
