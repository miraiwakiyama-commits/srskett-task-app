// タスク名の自動生成パターンを解決するユーティリティ。
// サーバー(タスク自動生成)・クライアント(ウィザードのプレビュー)の両方から使うため、
// DBアクセスを含まない純粋な文字列処理のみで構成する。

export type TitleTemplateVars = {
  client?: string;
  target?: string; // 対象者名(入力された場合のみ)
  date?: string; // 起算日(入社日/退社日、または起算日)
  subType?: string; // サブ種別のラベル(入社/退社、助成金名など)
  templateName?: string; // テンプレート自体の名称
  year?: string; // 対象年(月次給与のみ)
  month?: string; // 対象月(月次給与のみ)
};

export function renderTitleTemplate(pattern: string, vars: TitleTemplateVars): string {
  const rendered = pattern.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = (vars as Record<string, string | undefined>)[key];
    return value ?? "";
  });
  return rendered.replace(/\s+/g, " ").trim();
}

export const TITLE_TEMPLATE_PLACEHOLDERS: Record<string, string> = {
  HR: "{client}=クライアント名 / {target}=対象者名 / {date}=入社日・退社日 / {subType}=入社・退社",
  PAYROLL:
    "{client}=クライアント名 / {target}=対象者名(入力時のみ) / {date}=起算日 / {subType}=サブ種別 / {templateName}=テンプレート名 / {year}・{month}=対象年月(月次給与のみ)",
  GRANT: "{client}=クライアント名 / {target}=対象者名(入力時のみ) / {date}=起算日 / {subType}=助成金名 / {templateName}=テンプレート名",
  DEFAULT: "{client}=クライアント名 / {target}=対象者名(入力時のみ) / {date}=起算日 / {subType}=サブ種別 / {templateName}=テンプレート名",
};

export function titleTemplatePlaceholderHelp(category: string): string {
  if (category === "HR") return TITLE_TEMPLATE_PLACEHOLDERS.HR;
  if (category === "PAYROLL") return TITLE_TEMPLATE_PLACEHOLDERS.PAYROLL;
  if (category === "GRANT") return TITLE_TEMPLATE_PLACEHOLDERS.GRANT;
  return TITLE_TEMPLATE_PLACEHOLDERS.DEFAULT;
}
