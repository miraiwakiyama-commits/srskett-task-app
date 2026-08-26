// 本番DBの全テーブルをJSONとして書き出すバックアップスクリプト。
// Neonの無料プランはポイントインタイムリカバリの保持期間が6時間しかないため、
// それを補うための独自の定期バックアップとして使う。
import "dotenv/config";
import { writeFileSync, mkdirSync } from "fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [
    staffUsers,
    clients,
    taskCategoryDefs,
    taskTemplates,
    templateItems,
    tasks,
    checklistItems,
    notes,
    attachments,
  ] = await Promise.all([
    prisma.staffUser.findMany(),
    prisma.client.findMany(),
    prisma.taskCategoryDef.findMany(),
    prisma.taskTemplate.findMany(),
    prisma.templateItem.findMany(),
    prisma.task.findMany(),
    prisma.checklistItem.findMany(),
    prisma.note.findMany(),
    prisma.attachment.findMany(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    staffUsers,
    clients,
    taskCategoryDefs,
    taskTemplates,
    templateItems,
    tasks,
    checklistItems,
    notes,
    attachments,
  };

  const outDir = process.argv[2] ?? ".";
  mkdirSync(outDir, { recursive: true });
  const filename = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const outPath = `${outDir}/${filename}`;
  writeFileSync(outPath, JSON.stringify(backup, null, 2), "utf-8");

  const counts = Object.fromEntries(
    Object.entries(backup)
      .filter(([k]) => k !== "exportedAt")
      .map(([k, v]) => [k, (v as unknown[]).length])
  );
  console.log(JSON.stringify({ outPath, counts }, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
