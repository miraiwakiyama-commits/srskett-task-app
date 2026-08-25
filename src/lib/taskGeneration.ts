import { prisma } from "@/lib/prisma";
import { addDaysToDate, computePayrollDates, fmt, periodKeyOf } from "@/lib/dates";
import { renderTitleTemplate } from "@/lib/titleTemplate";

type TemplateItemLike = { title: string; order: number; dueOffsetDays: number };

function computeDueDateFromItems(baseDate: Date, items: TemplateItemLike[]): Date | null {
  if (items.length === 0) return null;
  return items.reduce<Date | null>((latest, item) => {
    const d = addDaysToDate(baseDate, item.dueOffsetDays);
    return !latest || d > latest ? d : latest;
  }, null);
}

/**
 * 入退社タスクをテンプレートから自動生成する。
 * dueBasis=HIRE_DATE/RESIGN_DATE の項目は、入力された入社日/退社日 + オフセット日数で期限を算出する。
 * 従業員を別途登録する運用は行わないため、対象者名は自由入力としてタイトルに埋め込む。
 */
export async function generateHrTask(params: {
  clientId: string;
  subType: "ONBOARDING" | "OFFBOARDING";
  targetName: string;
  baseDate: Date;
  assigneeId?: string;
}) {
  const { clientId, subType, targetName, baseDate, assigneeId } = params;

  const [template, client] = await Promise.all([
    prisma.taskTemplate.findFirst({
      where: { category: "HR", subType, isActive: true },
      include: { items: { orderBy: { order: "asc" } } },
    }),
    prisma.client.findUniqueOrThrow({ where: { id: clientId }, select: { name: true } }),
  ]);

  const taskDueDate = template ? computeDueDateFromItems(baseDate, template.items) ?? baseDate : baseDate;
  const baseDateLabel = subType === "ONBOARDING" ? "入社日" : "退社日";
  const subTypeLabelJa = subType === "ONBOARDING" ? "入社" : "退社";
  const defaultTitle = `${targetName} 様 ${subTypeLabelJa}手続き`;
  const title = template?.titleTemplate
    ? renderTitleTemplate(template.titleTemplate, {
        client: client.name,
        target: targetName,
        date: fmt(baseDate),
        subType: subTypeLabelJa,
        templateName: template.name,
      }) || defaultTitle
    : defaultTitle;

  const task = await prisma.task.create({
    data: {
      category: "HR",
      subType,
      title,
      clientId,
      assigneeId,
      dueDate: taskDueDate,
      status: "NOT_STARTED",
      baseDate,
      baseDateLabel,
    },
  });

  if (template) {
    await prisma.checklistItem.createMany({
      data: template.items.map((item) => ({
        taskId: task.id,
        title: item.title,
        order: item.order,
        dueDate: addDaysToDate(baseDate, item.dueOffsetDays),
        dueOffsetDays: item.dueOffsetDays,
      })),
    });
  }

  return task;
}

/**
 * 助成金案件タスクをテンプレートのステップ構成から自動生成する。
 * 各ステップの期限は案件登録日(起算日)からのオフセット日数で算出する。
 */
export async function generateGrantTask(params: {
  clientId: string;
  grantTemplateId: string;
  title?: string;
  targetName?: string;
  assigneeId?: string;
  startDate?: Date;
}) {
  const template = await prisma.taskTemplate.findUniqueOrThrow({
    where: { id: params.grantTemplateId },
    include: { items: { orderBy: { order: "asc" } } },
  });

  const startDate = params.startDate ?? new Date();
  const client = await prisma.client.findUniqueOrThrow({ where: { id: params.clientId } });

  const defaultTitle = `${client.name}${params.targetName ? ` ${params.targetName} 様` : ""} ${template.subType}申請`;
  const title =
    params.title ||
    (template.titleTemplate
      ? renderTitleTemplate(template.titleTemplate, {
          client: client.name,
          target: params.targetName,
          date: fmt(startDate),
          subType: template.subType,
          templateName: template.name,
        }) || defaultTitle
      : defaultTitle);

  const task = await prisma.task.create({
    data: {
      category: "GRANT",
      subType: template.subType,
      grantType: template.subType,
      title,
      clientId: params.clientId,
      assigneeId: params.assigneeId,
      dueDate: computeDueDateFromItems(startDate, template.items),
      status: "NOT_STARTED",
      baseDate: startDate,
      baseDateLabel: template.baseDateLabel,
    },
  });

  await prisma.checklistItem.createMany({
    data: template.items.map((item) => ({
      taskId: task.id,
      title: item.title,
      order: item.order,
      dueDate: addDaysToDate(startDate, item.dueOffsetDays),
      dueOffsetDays: item.dueOffsetDays,
    })),
  });

  return task;
}

/**
 * 入退社/給与/助成金以外の追加種別(カスタム種別)、および助成金以外でテンプレートを
 * 使った給与タスクを生成する。テンプレートを指定した場合は起算日からのオフセット日数で
 * チェックリストの期限を自動算出する。テンプレートを指定しない場合は単純なタスクとして作成する。
 */
export async function generateCustomCategoryTask(params: {
  category: string;
  clientId: string;
  templateId?: string;
  title?: string;
  targetName?: string;
  assigneeId?: string;
  startDate?: Date; // テンプレート使用時の起算日
  dueDate?: Date; // テンプレート未使用時の期限
}) {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: params.clientId } });

  if (params.templateId) {
    const template = await prisma.taskTemplate.findUniqueOrThrow({
      where: { id: params.templateId },
      include: { items: { orderBy: { order: "asc" } } },
    });
    const startDate = params.startDate ?? new Date();
    const defaultTitle = `${client.name}${params.targetName ? ` ${params.targetName} 様` : ""} ${template.name}`;
    const title =
      params.title ||
      (template.titleTemplate
        ? renderTitleTemplate(template.titleTemplate, {
            client: client.name,
            target: params.targetName,
            date: fmt(startDate),
            subType: template.subType,
            templateName: template.name,
          }) || defaultTitle
        : defaultTitle);

    const task = await prisma.task.create({
      data: {
        category: params.category,
        subType: template.subType,
        title,
        clientId: params.clientId,
        assigneeId: params.assigneeId,
        dueDate: computeDueDateFromItems(startDate, template.items),
        status: "NOT_STARTED",
        baseDate: startDate,
        baseDateLabel: template.baseDateLabel,
      },
    });

    await prisma.checklistItem.createMany({
      data: template.items.map((item) => ({
        taskId: task.id,
        title: item.title,
        order: item.order,
        dueDate: addDaysToDate(startDate, item.dueOffsetDays),
        dueOffsetDays: item.dueOffsetDays,
      })),
    });

    return task;
  }

  const defaultTitle = `${client.name}${params.targetName ? ` ${params.targetName} 様` : ""} ${params.category}`;
  return prisma.task.create({
    data: {
      category: params.category,
      subType: "OTHER",
      title: params.title || defaultTitle,
      clientId: params.clientId,
      assigneeId: params.assigneeId,
      dueDate: params.dueDate,
      status: "NOT_STARTED",
    },
  });
}

/**
 * 全クライアント(締め日/支払日が設定済み)の指定年月分の月次給与タスクを生成する。
 * 起算日は締め日とし、テンプレートのオフセット日数から各項目の期限を算出する(他の種別と同じ方式)。
 * 既に同じ periodKey のタスクが存在する場合はスキップし、重複生成を防ぐ。
 */
export async function generateMonthlyPayrollTasks(year: number, month1: number) {
  const periodKey = periodKeyOf(year, month1);
  const clients = await prisma.client.findMany({
    where: { hasPayroll: true, payrollClosingDay: { not: null }, payrollPayDay: { not: null } },
  });

  const template = await prisma.taskTemplate.findFirst({
    where: { category: "PAYROLL", subType: "MONTHLY", isActive: true },
    include: { items: { orderBy: { order: "asc" } } },
  });

  const created: string[] = [];
  for (const client of clients) {
    const existing = await prisma.task.findFirst({
      where: { clientId: client.id, category: "PAYROLL", subType: "MONTHLY", periodKey },
    });
    if (existing) continue;

    const { closingDate, payDate } = computePayrollDates(
      year,
      month1,
      client.payrollClosingDay!,
      client.payrollPayDay!,
      client.payrollPayMonthOffset
    );

    const taskDueDate = template ? computeDueDateFromItems(closingDate, template.items) ?? payDate : payDate;
    const defaultTitle = `${client.name} 給与計算 ${year}年${month1}月分`;
    const title =
      template?.titleTemplate
        ? renderTitleTemplate(template.titleTemplate, {
            client: client.name,
            date: fmt(closingDate),
            subType: template.subType,
            templateName: template.name,
            year: String(year),
            month: String(month1),
          }) || defaultTitle
        : defaultTitle;

    const task = await prisma.task.create({
      data: {
        category: "PAYROLL",
        subType: "MONTHLY",
        title,
        clientId: client.id,
        dueDate: taskDueDate,
        status: "NOT_STARTED",
        periodKey,
        baseDate: template ? closingDate : undefined,
        baseDateLabel: template ? template.baseDateLabel || "給与締め日" : undefined,
      },
    });

    if (template) {
      await prisma.checklistItem.createMany({
        data: template.items.map((item) => ({
          taskId: task.id,
          title: item.title,
          order: item.order,
          dueDate: addDaysToDate(closingDate, item.dueOffsetDays),
          dueOffsetDays: item.dueOffsetDays,
        })),
      });
    }
    created.push(task.id);
  }

  return created;
}

/**
 * タスクの起算日を変更し、その起算日からのオフセットで生成されたチェックリスト項目の期限、
 * およびタスク自身の期限(全項目中もっとも遅い期限)を再計算する。手動追加した項目
 * (dueOffsetDays が null)の期限は変更しない。
 */
export async function recomputeTaskFromBaseDate(taskId: string, baseDate: Date) {
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { checklist: true },
  });

  const offsetItems = task.checklist.filter(
    (item): item is typeof item & { dueOffsetDays: number } => item.dueOffsetDays != null
  );

  await prisma.$transaction([
    ...offsetItems.map((item) =>
      prisma.checklistItem.update({
        where: { id: item.id },
        data: { dueDate: addDaysToDate(baseDate, item.dueOffsetDays) },
      })
    ),
    prisma.task.update({
      where: { id: taskId },
      data: {
        baseDate,
        dueDate: offsetItems.length > 0 ? computeDueDateFromItems(baseDate, offsetItems) : task.dueDate,
      },
    }),
  ]);
}
