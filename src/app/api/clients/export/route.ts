import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/dates";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  const header = [
    "ID",
    "番号",
    "企業名",
    "担当者名",
    "担当者メール",
    "担当者電話",
    "プラン",
    "メモ",
    "給与計算あり",
    "締め日",
    "支払日",
    "支払月オフセット",
    "アーカイブ",
  ];
  const rows = clients.map((c) =>
    [
      c.id,
      c.clientNumber ?? "",
      c.name,
      c.contactName ?? "",
      c.contactEmail ?? "",
      c.contactPhone ?? "",
      c.plan ?? "",
      c.notes ?? "",
      c.hasPayroll ? "あり" : "なし",
      c.payrollClosingDay ?? "",
      c.payrollPayDay ?? "",
      c.payrollPayMonthOffset,
      c.archived ? "あり" : "なし",
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\r\n");
  const body = String.fromCharCode(0xfeff) + csv; // Excelでの文字化け防止のためBOMを付与

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients_${fmt(new Date(), "yyyyMMdd_HHmm")}.csv"`,
    },
  });
}
