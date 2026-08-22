import ClientForm from "@/components/forms/ClientForm";
import { createClient } from "@/lib/actions/clients";

export default function NewClientPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold text-slate-900">新規クライアント登録</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <ClientForm action={createClient} submitLabel="登録する" />
      </div>
    </div>
  );
}
