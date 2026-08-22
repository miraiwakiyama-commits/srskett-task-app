import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const staffA = await prisma.staffUser.upsert({
    where: { email: "tanaka@example-sr.jp" },
    update: {},
    create: {
      name: "田中 一郎",
      email: "tanaka@example-sr.jp",
      passwordHash,
      role: "admin",
    },
  });

  const staffB = await prisma.staffUser.upsert({
    where: { email: "sato@example-sr.jp" },
    update: {},
    create: {
      name: "佐藤 花子",
      email: "sato@example-sr.jp",
      passwordHash,
      role: "staff",
    },
  });

  // ---- テンプレート: 入退社 ----
  const onboardingTemplate = await prisma.taskTemplate.create({
    data: {
      category: "HR",
      subType: "ONBOARDING",
      name: "入社手続き標準テンプレート",
      description: "入社時に必要な標準的な手続き一式",
      items: {
        create: [
          { title: "雇用契約書の締結", order: 1, dueBasis: "HIRE_DATE", dueOffsetDays: 0 },
          { title: "労働条件通知書の交付", order: 2, dueBasis: "HIRE_DATE", dueOffsetDays: 0 },
          { title: "マイナンバーの収集・確認", order: 3, dueBasis: "HIRE_DATE", dueOffsetDays: 3 },
          { title: "社会保険資格取得届の提出", order: 4, dueBasis: "HIRE_DATE", dueOffsetDays: 5 },
          { title: "雇用保険資格取得届の提出", order: 5, dueBasis: "HIRE_DATE", dueOffsetDays: 10 },
          { title: "給与振込口座の登録", order: 6, dueBasis: "HIRE_DATE", dueOffsetDays: 5 },
        ],
      },
    },
  });

  const offboardingTemplate = await prisma.taskTemplate.create({
    data: {
      category: "HR",
      subType: "OFFBOARDING",
      name: "退社手続き標準テンプレート",
      description: "退社時に必要な標準的な手続き一式",
      items: {
        create: [
          { title: "健康保険・厚生年金 資格喪失届の提出", order: 1, dueBasis: "RESIGN_DATE", dueOffsetDays: 5 },
          { title: "雇用保険 資格喪失届の提出", order: 2, dueBasis: "RESIGN_DATE", dueOffsetDays: 10 },
          { title: "離職証明書の作成・提出", order: 3, dueBasis: "RESIGN_DATE", dueOffsetDays: 10 },
          { title: "住民税手続き(異動届出書)", order: 4, dueBasis: "RESIGN_DATE", dueOffsetDays: 10 },
          { title: "源泉徴収票の発行", order: 5, dueBasis: "RESIGN_DATE", dueOffsetDays: 30 },
          { title: "貸与品(PC・社員証等)回収確認", order: 6, dueBasis: "RESIGN_DATE", dueOffsetDays: 0 },
        ],
      },
    },
  });

  // ---- テンプレート: 給与 ----
  const monthlyPayrollTemplate = await prisma.taskTemplate.create({
    data: {
      category: "PAYROLL",
      subType: "MONTHLY",
      name: "月次給与計算テンプレート",
      description: "毎月の給与計算業務チェックリスト",
      items: {
        create: [
          { title: "勤怠データの締め・確認", order: 1, dueBasis: "TASK_CREATED", dueOffsetDays: 0 },
          { title: "給与計算の実施", order: 2, dueBasis: "TASK_CREATED", dueOffsetDays: 0 },
          { title: "社会保険料・雇用保険料の控除確認", order: 3, dueBasis: "TASK_CREATED", dueOffsetDays: 0 },
          { title: "給与明細の発行", order: 4, dueBasis: "TASK_CREATED", dueOffsetDays: 0 },
          { title: "振込データの作成・送付", order: 5, dueBasis: "TASK_CREATED", dueOffsetDays: 0 },
        ],
      },
    },
  });

  const yearEndTemplate = await prisma.taskTemplate.create({
    data: {
      category: "PAYROLL",
      subType: "YEAREND",
      name: "年末調整テンプレート",
      items: {
        create: [
          { title: "扶養控除等申告書の回収", order: 1, dueBasis: "TASK_CREATED", dueOffsetDays: 0 },
          { title: "保険料控除申告書の回収", order: 2, dueBasis: "TASK_CREATED", dueOffsetDays: 0 },
          { title: "年税額の計算", order: 3, dueBasis: "TASK_CREATED", dueOffsetDays: 14 },
          { title: "源泉徴収票の作成・配布", order: 4, dueBasis: "TASK_CREATED", dueOffsetDays: 21 },
          { title: "法定調書合計表の提出", order: 5, dueBasis: "TASK_CREATED", dueOffsetDays: 30 },
        ],
      },
    },
  });

  const bonusTemplate = await prisma.taskTemplate.create({
    data: {
      category: "PAYROLL",
      subType: "BONUS",
      name: "賞与計算テンプレート",
      items: {
        create: [
          { title: "賞与支給額の確定", order: 1, dueBasis: "TASK_CREATED", dueOffsetDays: 0 },
          { title: "社会保険料・源泉所得税の計算", order: 2, dueBasis: "TASK_CREATED", dueOffsetDays: 2 },
          { title: "賞与明細の発行", order: 3, dueBasis: "TASK_CREATED", dueOffsetDays: 3 },
          { title: "振込データの作成・送付", order: 4, dueBasis: "TASK_CREATED", dueOffsetDays: 3 },
          { title: "賞与支払届の提出", order: 5, dueBasis: "TASK_CREATED", dueOffsetDays: 5 },
        ],
      },
    },
  });

  // ---- テンプレート: 助成金 ----
  const careerUpGrant = await prisma.taskTemplate.create({
    data: {
      category: "GRANT",
      subType: "キャリアアップ助成金",
      name: "キャリアアップ助成金 標準ステップ",
      items: {
        create: [
          { title: "キャリアアップ計画の作成・提出", order: 1, dueBasis: "TASK_CREATED", dueOffsetDays: 14 },
          { title: "制度の導入・実施", order: 2, dueBasis: "TASK_CREATED", dueOffsetDays: 90 },
          { title: "支給申請書の提出", order: 3, dueBasis: "TASK_CREATED", dueOffsetDays: 120 },
          { title: "受給・実績確認", order: 4, dueBasis: "TASK_CREATED", dueOffsetDays: 150 },
        ],
      },
    },
  });

  const koyouChoseiGrant = await prisma.taskTemplate.create({
    data: {
      category: "GRANT",
      subType: "雇用調整助成金",
      name: "雇用調整助成金 標準ステップ",
      items: {
        create: [
          { title: "休業等実施計画(届)の提出", order: 1, dueBasis: "TASK_CREATED", dueOffsetDays: 7 },
          { title: "休業等の実施", order: 2, dueBasis: "TASK_CREATED", dueOffsetDays: 30 },
          { title: "支給申請書の提出", order: 3, dueBasis: "TASK_CREATED", dueOffsetDays: 60 },
          { title: "受給・実績確認", order: 4, dueBasis: "TASK_CREATED", dueOffsetDays: 90 },
        ],
      },
    },
  });

  // ---- 顧問先企業 ----
  const clientA = await prisma.client.create({
    data: {
      name: "株式会社サンプル商事",
      contactName: "山田 太郎",
      contactEmail: "yamada@sample-shoji.co.jp",
      contactPhone: "03-1234-5678",
      plan: "顧問契約(標準プラン)",
      payrollClosingDay: 20,
      payrollPayDay: 25,
      payrollPayMonthOffset: 1,
    },
  });

  const clientB = await prisma.client.create({
    data: {
      name: "有限会社みらい工業",
      contactName: "鈴木 次郎",
      contactEmail: "suzuki@mirai-kogyo.co.jp",
      contactPhone: "06-2345-6789",
      plan: "顧問契約(フルサポート)",
      payrollClosingDay: 31,
      payrollPayDay: 10,
      payrollPayMonthOffset: 1,
    },
  });

  const clientC = await prisma.client.create({
    data: {
      name: "合同会社グリーンフィールズ",
      contactName: "高橋 美咲",
      contactEmail: "takahashi@greenfields.jp",
      plan: "スポット契約",
      payrollClosingDay: 15,
      payrollPayDay: 25,
      payrollPayMonthOffset: 0,
    },
  });

  // ---- サンプルタスク ----
  const today = new Date();
  const in2days = new Date(today);
  in2days.setDate(today.getDate() + 2);
  const overdue = new Date(today);
  overdue.setDate(today.getDate() - 3);

  const onboardingTask = await prisma.task.create({
    data: {
      category: "HR",
      subType: "ONBOARDING",
      title: "伊藤 健太 様 入社手続き",
      clientId: clientA.id,
      assigneeId: staffA.id,
      dueDate: in2days,
      status: "IN_PROGRESS",
    },
  });

  await prisma.checklistItem.createMany({
    data: [
      { taskId: onboardingTask.id, title: "雇用契約書の締結", order: 1, done: true },
      { taskId: onboardingTask.id, title: "社会保険資格取得届の提出", order: 2, dueDate: in2days },
      { taskId: onboardingTask.id, title: "雇用保険資格取得届の提出", order: 3 },
    ],
  });

  const payrollTask = await prisma.task.create({
    data: {
      category: "PAYROLL",
      subType: "MONTHLY",
      title: `${clientB.name} 給与計算 ${today.getFullYear()}年${today.getMonth() + 1}月分`,
      clientId: clientB.id,
      assigneeId: staffB.id,
      dueDate: overdue,
      status: "NOT_STARTED",
      periodKey: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
    },
  });
  await prisma.checklistItem.createMany({
    data: [
      { taskId: payrollTask.id, title: "勤怠データの締め・確認", order: 1 },
      { taskId: payrollTask.id, title: "給与計算の実施", order: 2 },
      { taskId: payrollTask.id, title: "給与明細の発行", order: 3 },
    ],
  });

  const grantTask = await prisma.task.create({
    data: {
      category: "GRANT",
      subType: "キャリアアップ助成金",
      title: `${clientC.name} キャリアアップ助成金申請`,
      clientId: clientC.id,
      assigneeId: staffA.id,
      grantType: "キャリアアップ助成金",
      dueDate: new Date(new Date().setDate(today.getDate() + 14)),
      status: "NOT_STARTED",
    },
  });
  await prisma.checklistItem.createMany({
    data: [
      { taskId: grantTask.id, title: "キャリアアップ計画の作成・提出", order: 1, dueDate: new Date(new Date().setDate(today.getDate() + 14)) },
      { taskId: grantTask.id, title: "制度の導入・実施", order: 2 },
      { taskId: grantTask.id, title: "支給申請書の提出", order: 3 },
      { taskId: grantTask.id, title: "受給・実績確認", order: 4 },
    ],
  });

  console.log("シードデータ投入完了");
  console.log(`ログイン情報: ${staffA.email} / password123`);

  void onboardingTemplate;
  void offboardingTemplate;
  void monthlyPayrollTemplate;
  void yearEndTemplate;
  void bonusTemplate;
  void careerUpGrant;
  void koyouChoseiGrant;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
