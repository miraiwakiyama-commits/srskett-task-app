export const TASK_CATEGORIES = {
  HR: "HR",
  PAYROLL: "PAYROLL",
  GRANT: "GRANT",
} as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[keyof typeof TASK_CATEGORIES];

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  HR: "入退社",
  PAYROLL: "給与",
  GRANT: "助成金",
};

export const HR_SUBTYPES = {
  ONBOARDING: "ONBOARDING",
  OFFBOARDING: "OFFBOARDING",
} as const;
export const HR_SUBTYPE_LABELS: Record<string, string> = {
  ONBOARDING: "入社",
  OFFBOARDING: "退社",
};

export const PAYROLL_SUBTYPES = {
  MONTHLY: "MONTHLY",
  YEAREND: "YEAREND",
  BONUS: "BONUS",
  OTHER: "OTHER",
} as const;
export const PAYROLL_SUBTYPE_LABELS: Record<string, string> = {
  MONTHLY: "月次給与計算",
  YEAREND: "年末調整",
  BONUS: "賞与計算",
  OTHER: "その他",
};

export const GRANT_SUBTYPE_LABELS: Record<string, string> = {};

export const TASK_STATUSES = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  PENDING_REVIEW: "PENDING_REVIEW",
  DONE: "DONE",
} as const;
export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  NOT_STARTED: "未着手",
  IN_PROGRESS: "対応中",
  PENDING_REVIEW: "確認待ち",
  DONE: "完了",
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "PENDING_REVIEW",
  "DONE",
];

export const TASK_STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700 ring-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 ring-blue-300",
  PENDING_REVIEW: "bg-amber-100 text-amber-700 ring-amber-300",
  DONE: "bg-emerald-100 text-emerald-700 ring-emerald-300",
};

export const DUE_BASIS = {
  HIRE_DATE: "HIRE_DATE",
  RESIGN_DATE: "RESIGN_DATE",
  TASK_CREATED: "TASK_CREATED",
} as const;
export const DUE_BASIS_LABELS: Record<string, string> = {
  HIRE_DATE: "入社日基準",
  RESIGN_DATE: "退社日基準",
  TASK_CREATED: "起算日基準(案件登録日/前ステップ)",
};

export function categoryLabel(category: string) {
  return TASK_CATEGORY_LABELS[category as TaskCategory] ?? category;
}

export function subTypeLabel(category: string, subType: string) {
  if (category === "HR") return HR_SUBTYPE_LABELS[subType] ?? subType;
  if (category === "PAYROLL") return PAYROLL_SUBTYPE_LABELS[subType] ?? subType;
  // カスタム種別でテンプレートを使わず作成したタスクは subType="OTHER" が入るが、
  // カテゴリ名と重複するだけなので表示しない。
  if (subType === "OTHER") return "";
  return subType;
}

export function statusLabel(status: string) {
  return TASK_STATUS_LABELS[status as TaskStatus] ?? status;
}

/** "種別 / サブ種別" 形式の表示用文字列。サブ種別が無ければ種別のみ返す。 */
export function categorySubtitle(category: string, subType: string) {
  const sub = subTypeLabel(category, subType);
  return sub ? `${categoryLabel(category)} / ${sub}` : categoryLabel(category);
}
