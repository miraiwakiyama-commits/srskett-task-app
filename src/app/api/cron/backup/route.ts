import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadBackupToDrive } from "@/lib/googleDriveBackup";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const filename = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const result = await uploadBackupToDrive(JSON.stringify(backup), filename);

  return NextResponse.json({
    ok: true,
    filename,
    deletedOldBackups: result.deletedCount,
  });
}
