"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCsv } from "@/lib/csv";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return v.trim();
}

function intOrNull(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function checkbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export async function createClient(formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("企業名は必須です");

  const client = await prisma.client.create({
    data: {
      name,
      clientNumber: str(formData, "clientNumber"),
      contactName: str(formData, "contactName"),
      contactEmail: str(formData, "contactEmail"),
      contactPhone: str(formData, "contactPhone"),
      plan: str(formData, "plan"),
      notes: str(formData, "notes"),
      hasPayroll: checkbox(formData, "hasPayroll"),
      payrollClosingDay: intOrNull(formData, "payrollClosingDay"),
      payrollPayDay: intOrNull(formData, "payrollPayDay"),
      payrollPayMonthOffset: intOrNull(formData, "payrollPayMonthOffset") ?? 1,
    },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(clientId: string, formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("企業名は必須です");

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      clientNumber: str(formData, "clientNumber") ?? null,
      contactName: str(formData, "contactName") ?? null,
      contactEmail: str(formData, "contactEmail") ?? null,
      contactPhone: str(formData, "contactPhone") ?? null,
      plan: str(formData, "plan") ?? null,
      notes: str(formData, "notes") ?? null,
      hasPayroll: checkbox(formData, "hasPayroll"),
      payrollClosingDay: intOrNull(formData, "payrollClosingDay"),
      payrollPayDay: intOrNull(formData, "payrollPayDay"),
      payrollPayMonthOffset: intOrNull(formData, "payrollPayMonthOffset") ?? 1,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function deleteClient(clientId: string) {
  await prisma.client.delete({ where: { id: clientId } });
  revalidatePath("/clients");
  redirect("/clients");
}

export async function toggleClientArchived(clientId: string, archived: boolean) {
  await prisma.client.update({ where: { id: clientId }, data: { archived } });
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/tasks/new");
}

const CSV_TRUE_VALUES = new Set(["あり", "true", "TRUE", "1", "○"]);

// ExcelでCSV保存すると(特に日本語版Windowsの既定の「CSV(コンマ区切り)」形式では)
// UTF-8ではなくShift-JISで出力されることが多いため、UTF-8として不正な場合はShift-JISとして読み直す。
function decodeCsvBuffer(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("shift_jis").decode(buffer);
  }
}

export async function importClientsFromCsv(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("CSVファイルを選択してください");
  }

  const text = decodeCsvBuffer(await file.arrayBuffer());
  const rows = parseCsv(text);
  if (rows.length === 0) throw new Error("CSVにデータがありません");

  const [header, ...dataRows] = rows;
  const colIndex = (name: string) => header.findIndex((h) => h.trim() === name);

  const nameIdx = colIndex("企業名");
  if (nameIdx === -1) throw new Error("見出し行に「企業名」列が見つかりません");

  const idIdx = colIndex("ID");
  const clientNumberIdx = colIndex("番号");
  const contactNameIdx = colIndex("担当者名");
  const contactEmailIdx = colIndex("担当者メール");
  const contactPhoneIdx = colIndex("担当者電話");
  const planIdx = colIndex("プラン");
  const notesIdx = colIndex("メモ");
  const hasPayrollIdx = colIndex("給与計算あり");
  const closingDayIdx = colIndex("締め日");
  const payDayIdx = colIndex("支払日");
  const payOffsetIdx = colIndex("支払月オフセット");
  const archivedIdx = colIndex("アーカイブ");

  const get = (row: string[], idx: number): string | undefined => {
    if (idx < 0) return undefined;
    const v = row[idx]?.trim();
    return v ? v : undefined;
  };
  const toInt = (v: string | undefined): number | null => {
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of dataRows) {
    if (row.every((cell) => cell.trim() === "")) continue;

    const name = get(row, nameIdx);
    if (!name) {
      skipped++;
      continue;
    }

    const hasPayrollRaw = get(row, hasPayrollIdx);
    const hasPayroll = hasPayrollRaw === undefined ? true : CSV_TRUE_VALUES.has(hasPayrollRaw);
    const archivedRaw = get(row, archivedIdx);
    const archived = archivedRaw === undefined ? false : CSV_TRUE_VALUES.has(archivedRaw);

    const data = {
      name,
      clientNumber: get(row, clientNumberIdx) ?? null,
      contactName: get(row, contactNameIdx) ?? null,
      contactEmail: get(row, contactEmailIdx) ?? null,
      contactPhone: get(row, contactPhoneIdx) ?? null,
      plan: get(row, planIdx) ?? null,
      notes: get(row, notesIdx) ?? null,
      hasPayroll,
      payrollClosingDay: toInt(get(row, closingDayIdx)),
      payrollPayDay: toInt(get(row, payDayIdx)),
      payrollPayMonthOffset: toInt(get(row, payOffsetIdx)) ?? 1,
      archived,
    };

    const id = get(row, idIdx);

    try {
      if (id) {
        // ID列が一致する既存クライアントを更新する(エクスポート→編集→再取り込みでの一括編集用)
        await prisma.client.update({ where: { id }, data });
        updated++;
      } else {
        await prisma.client.create({ data });
        created++;
      }
    } catch {
      // 1行のデータ不備(型不正・存在しないIDなど)で取り込み全体を失敗させないよう、その行だけスキップする
      skipped++;
    }
  }

  revalidatePath("/clients");
  return { created, updated, skipped };
}
