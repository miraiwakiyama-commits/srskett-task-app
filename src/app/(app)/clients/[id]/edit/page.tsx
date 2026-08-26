import { notFound } from "next/navigation";
import ClientForm from "@/components/forms/ClientForm";
import { updateClient } from "@/lib/actions/clients";
import { prisma } from "@/lib/prisma";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const action = updateClient.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold text-slate-900">{client.name} の編集</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <ClientForm
          action={action}
          submitLabel="更新する"
          defaultValues={{
            clientNumber: client.clientNumber ?? "",
            name: client.name,
            contactName: client.contactName ?? "",
            contactEmail: client.contactEmail ?? "",
            contactPhone: client.contactPhone ?? "",
            plan: client.plan ?? "",
            notes: client.notes ?? "",
            hasPayroll: client.hasPayroll,
            payrollClosingDay: client.payrollClosingDay?.toString() ?? "",
            payrollPayDay: client.payrollPayDay?.toString() ?? "",
            payrollPayMonthOffset: client.payrollPayMonthOffset.toString(),
          }}
        />
      </div>
    </div>
  );
}
