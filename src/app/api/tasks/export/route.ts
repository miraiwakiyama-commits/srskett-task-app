import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { categoryLabel, subTypeLabel, statusLabel } from "@/lib/constants";
import { fmt } from "@/lib/dates";
import type { Prisma } from "@/generated/prisma/client";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const where: Prisma.TaskWhereInput = {};
  const category = sp.get("category");
  const status = sp.getAll("status");
  const clientId = sp.get("clientId");
  const q = sp.get("q");
  if (category) where.category = category;
  if (status.length > 0) where.status = { in: status };
  if (clientId) where.clientId = clientId;
  if (q) where.title = { contains: q };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: { client: true, assignee: true },
  });

  const header = ["種別", "サブ種別", "タイトル", "クライアント", "担当者", "期限", "ステータス", "登録日"];
  const rows = tasks.map((t) =>
    [
      categoryLabel(t.category),
      subTypeLabel(t.category, t.subType),
      t.title,
      t.client.name,
      t.assignee?.name ?? "",
      fmt(t.dueDate),
      statusLabel(t.status),
      fmt(t.createdAt),
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\r\n");
  const body = "﻿" + csv; // Excelでの文字化け防止のためBOMを付与

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tasks_${fmt(new Date(), "yyyyMMdd_HHmm")}.csv"`,
    },
  });
}
