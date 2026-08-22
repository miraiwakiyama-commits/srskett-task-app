export type CategoryColorSet = {
  dot: string;
  bg: string;
  border: string;
};

const BASE_CATEGORY_COLOR: Record<string, CategoryColorSet> = {
  HR: { dot: "bg-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
  PAYROLL: { dot: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
  GRANT: { dot: "bg-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
};

// カスタムカテゴリ(TaskCategoryDef)用に、標準カテゴリと被らない色を順番に割り当てる
const CUSTOM_CATEGORY_PALETTE: CategoryColorSet[] = [
  { dot: "bg-pink-500", bg: "bg-pink-50", border: "border-pink-200" },
  { dot: "bg-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
  { dot: "bg-cyan-500", bg: "bg-cyan-50", border: "border-cyan-200" },
  { dot: "bg-lime-500", bg: "bg-lime-50", border: "border-lime-200" },
  { dot: "bg-rose-500", bg: "bg-rose-50", border: "border-rose-200" },
  { dot: "bg-teal-500", bg: "bg-teal-50", border: "border-teal-200" },
];

const DEFAULT_CATEGORY_COLOR: CategoryColorSet = {
  dot: "bg-slate-400",
  bg: "bg-slate-50",
  border: "border-slate-200",
};

// カレンダーページで割り当てているカテゴリ色と、他ページ(タスク詳細・ダッシュボード等)の
// 背景色を必ず一致させるための共通マップ生成関数。customCategories は
// prisma.taskCategoryDef.findMany({ orderBy: { order: "asc" } }) の順序で渡すこと。
export function buildCategoryColorMap(customCategories: { name: string }[]): Record<string, CategoryColorSet> {
  const map: Record<string, CategoryColorSet> = { ...BASE_CATEGORY_COLOR };
  customCategories.forEach((c, i) => {
    map[c.name] = CUSTOM_CATEGORY_PALETTE[i % CUSTOM_CATEGORY_PALETTE.length];
  });
  return map;
}

export function categoryColor(map: Record<string, CategoryColorSet>, category: string): CategoryColorSet {
  return map[category] ?? DEFAULT_CATEGORY_COLOR;
}
