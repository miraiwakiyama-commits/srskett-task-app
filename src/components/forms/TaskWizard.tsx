"use client";

import { useMemo, useState } from "react";
import { useRouter, unstable_rethrow } from "next/navigation";
import { createTask, createGrantTask, createHrTask, createCustomCategoryTask } from "@/lib/actions/tasks";
import { PAYROLL_SUBTYPE_LABELS } from "@/lib/constants";
import { renderTitleTemplate } from "@/lib/titleTemplate";

type Client = { id: string; name: string };
type Staff = { id: string; name: string };
type TemplateOption = {
  id: string;
  name: string;
  category: string;
  subType: string;
  baseDateLabel: string;
  titleTemplate: string | null;
};
type CustomCategory = { name: string };

type HrSubType = "ONBOARDING" | "OFFBOARDING";
type PayrollSubType = "MONTHLY" | "YEAREND" | "BONUS" | "OTHER";

const HR_STEPS = ["subType", "client", "name", "date", "assignee", "confirm"] as const;
const PAYROLL_STEPS = ["subType", "client", "target", "title", "date", "assignee", "confirm"] as const;
const GRANT_STEPS = ["client", "target", "template", "title", "startDate", "assignee", "confirm"] as const;
const CUSTOM_STEPS = ["client", "target", "template", "title", "date", "assignee", "confirm"] as const;

export default function TaskWizard({
  clients,
  staff,
  templates,
  customCategories,
  defaultClientId,
}: {
  clients: Client[];
  staff: Staff[];
  templates: TemplateOption[];
  customCategories: CustomCategory[];
  defaultClientId?: string;
}) {
  const router = useRouter();

  const [category, setCategory] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hrSubType, setHrSubType] = useState<HrSubType>("ONBOARDING");
  const [payrollSubType, setPayrollSubType] = useState<PayrollSubType>("MONTHLY");
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [targetName, setTargetName] = useState("");
  const [baseDate, setBaseDate] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const isBuiltIn = category === "HR" || category === "PAYROLL" || category === "GRANT";

  const clientName = useMemo(() => clients.find((c) => c.id === clientId)?.name ?? "", [clients, clientId]);
  const staffName = useMemo(() => staff.find((s) => s.id === assigneeId)?.name ?? "未割当", [staff, assigneeId]);
  const categoryTemplates = useMemo(
    () => templates.filter((t) => t.category === category),
    [templates, category]
  );
  const selectedTemplate = useMemo(
    () => categoryTemplates.find((t) => t.id === templateId),
    [categoryTemplates, templateId]
  );
  const selectedTemplateName = selectedTemplate?.name ?? "";
  const selectedTemplateBaseDateLabel = selectedTemplate?.baseDateLabel || "起算日";
  const payrollTemplate = useMemo(
    () => templates.find((t) => t.category === "PAYROLL" && t.subType === payrollSubType),
    [templates, payrollSubType]
  );
  const hrTemplate = useMemo(
    () => templates.find((t) => t.category === "HR" && t.subType === hrSubType),
    [templates, hrSubType]
  );

  const hrSubTypeLabel = hrSubType === "ONBOARDING" ? "入社" : "退社";
  const hrDefaultTitle = `${targetName} 様 ${hrSubTypeLabel}手続き`;
  const hrComputedTitle =
    (hrTemplate?.titleTemplate &&
      renderTitleTemplate(hrTemplate.titleTemplate, {
        client: clientName,
        target: targetName,
        date: baseDate,
        subType: hrSubTypeLabel,
        templateName: hrTemplate.name,
      })) ||
    hrDefaultTitle;

  const targetPrefix = targetName.trim() ? ` ${targetName.trim()} 様` : "";

  const payrollDefaultTitle = `${clientName}${targetPrefix} ${PAYROLL_SUBTYPE_LABELS[payrollSubType]}`;
  const payrollComputedTitle =
    (payrollTemplate?.titleTemplate &&
      renderTitleTemplate(payrollTemplate.titleTemplate, {
        client: clientName,
        target: targetName.trim() || undefined,
        date: startDate,
        subType: payrollTemplate.subType,
        templateName: payrollTemplate.name,
      })) ||
    payrollDefaultTitle;

  const grantDefaultTitle = `${clientName}${targetPrefix} ${selectedTemplateName}申請`;
  const grantComputedTitle =
    (selectedTemplate?.titleTemplate &&
      renderTitleTemplate(selectedTemplate.titleTemplate, {
        client: clientName,
        target: targetName.trim() || undefined,
        date: startDate,
        subType: selectedTemplate.subType,
        templateName: selectedTemplate.name,
      })) ||
    grantDefaultTitle;

  const customDefaultTitle = templateId
    ? `${clientName}${targetPrefix} ${selectedTemplateName}`
    : `${clientName}${targetPrefix} ${category ?? ""}`;
  const customComputedTitle =
    (templateId &&
      selectedTemplate?.titleTemplate &&
      renderTitleTemplate(selectedTemplate.titleTemplate, {
        client: clientName,
        target: targetName.trim() || undefined,
        date: startDate,
        subType: selectedTemplate.subType,
        templateName: selectedTemplate.name,
      })) ||
    customDefaultTitle;

  const steps =
    category === "HR"
      ? HR_STEPS
      : category === "PAYROLL"
      ? PAYROLL_STEPS
      : category === "GRANT"
      ? GRANT_STEPS
      : category
      ? CUSTOM_STEPS
      : [];
  const currentKey = steps[step];

  function reset() {
    setCategory(null);
    setStep(0);
    setError(null);
    setTemplateId("");
    setTitle("");
    setDueDate("");
    setStartDate("");
    setTargetName("");
  }

  function selectCategory(value: string) {
    setCategory(value);
    setStep(0);
    setTemplateId("");
    setTitle("");
    setDueDate("");
    setStartDate("");
    setTargetName("");
  }

  function goNext() {
    setError(null);
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function goBack() {
    setError(null);
    if (step === 0) {
      reset();
    } else {
      setStep((s) => s - 1);
    }
  }

  function canProceed(): boolean {
    switch (currentKey) {
      case "client":
        return !!clientId;
      case "name":
        return !!targetName.trim();
      case "date":
        return category === "HR" ? !!baseDate : true;
      case "template":
        return category === "GRANT" ? !!templateId : true;
      default:
        return true;
    }
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      if (category === "HR") {
        const fd = new FormData();
        fd.set("clientId", clientId);
        fd.set("subType", hrSubType);
        fd.set("targetName", targetName);
        fd.set("baseDate", baseDate);
        if (assigneeId) fd.set("assigneeId", assigneeId);
        await createHrTask(fd);
      } else if (category === "PAYROLL" && payrollTemplate) {
        const fd = new FormData();
        fd.set("category", "PAYROLL");
        fd.set("clientId", clientId);
        fd.set("templateId", payrollTemplate.id);
        if (title) fd.set("title", title);
        if (targetName.trim()) fd.set("targetName", targetName.trim());
        if (startDate) fd.set("startDate", startDate);
        if (assigneeId) fd.set("assigneeId", assigneeId);
        await createCustomCategoryTask(fd);
      } else if (category === "PAYROLL") {
        const fd = new FormData();
        fd.set("category", "PAYROLL");
        fd.set("subType", payrollSubType);
        fd.set("clientId", clientId);
        fd.set("title", title || payrollDefaultTitle);
        if (dueDate) fd.set("dueDate", dueDate);
        if (assigneeId) fd.set("assigneeId", assigneeId);
        if (description) fd.set("description", description);
        await createTask(fd);
      } else if (category === "GRANT") {
        const fd = new FormData();
        fd.set("clientId", clientId);
        fd.set("grantTemplateId", templateId);
        if (title) fd.set("title", title);
        if (targetName.trim()) fd.set("targetName", targetName.trim());
        if (startDate) fd.set("startDate", startDate);
        if (assigneeId) fd.set("assigneeId", assigneeId);
        await createGrantTask(fd);
      } else if (category) {
        const fd = new FormData();
        fd.set("category", category);
        fd.set("clientId", clientId);
        if (templateId) fd.set("templateId", templateId);
        if (title) fd.set("title", title);
        if (targetName.trim()) fd.set("targetName", targetName.trim());
        if (templateId) {
          if (startDate) fd.set("startDate", startDate);
        } else if (dueDate) {
          fd.set("dueDate", dueDate);
        }
        if (assigneeId) fd.set("assigneeId", assigneeId);
        await createCustomCategoryTask(fd);
      }
    } catch (e) {
      unstable_rethrow(e);
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setSubmitting(false);
    }
  }

  // ---- カテゴリ未選択: 最初の質問 ----
  if (!category) {
    return (
      <div>
        <QuestionTitle>どの種類のタスクを作成しますか?</QuestionTitle>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <CategoryTile label="入退社" description="入社・退社に伴う手続き" onClick={() => selectCategory("HR")} />
          <CategoryTile label="給与" description="月次給与・年末調整・賞与等" onClick={() => selectCategory("PAYROLL")} />
          <CategoryTile label="助成金" description="申請〜受給までの案件管理" onClick={() => selectCategory("GRANT")} />
          {customCategories.map((c) => (
            <CategoryTile key={c.name} label={c.name} description="カスタム種別" onClick={() => selectCategory(c.name)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <ProgressBar step={step} total={steps.length} />

      {category === "HR" && (
        <>
          {currentKey === "subType" && (
            <div>
              <QuestionTitle>入社・退社どちらの手続きですか?</QuestionTitle>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <ChoiceTile label="入社" selected={hrSubType === "ONBOARDING"} onClick={() => setHrSubType("ONBOARDING")} />
                <ChoiceTile label="退社" selected={hrSubType === "OFFBOARDING"} onClick={() => setHrSubType("OFFBOARDING")} />
              </div>
            </div>
          )}
          {currentKey === "client" && (
            <div>
              <QuestionTitle>対象のクライアントを選択してください</QuestionTitle>
              <ClientSelect clients={clients} value={clientId} onChange={setClientId} />
            </div>
          )}
          {currentKey === "name" && (
            <div>
              <QuestionTitle>対象者の氏名を入力してください</QuestionTitle>
              <TextField value={targetName} onChange={setTargetName} placeholder="例: 山田 太郎" autoFocus />
            </div>
          )}
          {currentKey === "date" && (
            <div>
              <QuestionTitle>{hrSubType === "ONBOARDING" ? "入社日" : "退社日"}を入力してください</QuestionTitle>
              <p className="mt-1 text-sm text-slate-500">
                この日付を起算日として、テンプレートのチェックリストと提出期限を自動生成します。
              </p>
              <DateField value={baseDate} onChange={setBaseDate} />
            </div>
          )}
          {currentKey === "assignee" && (
            <div>
              <QuestionTitle>担当者を選択してください(任意)</QuestionTitle>
              <StaffSelect staff={staff} value={assigneeId} onChange={setAssigneeId} />
            </div>
          )}
          {currentKey === "confirm" && (
            <ConfirmScreen
              rows={[
                ["種別", `入退社 / ${hrSubType === "ONBOARDING" ? "入社" : "退社"}`],
                ["クライアント", clientName],
                ["タスク名", hrComputedTitle],
                ["対象者", `${targetName} 様`],
                [hrSubType === "ONBOARDING" ? "入社日" : "退社日", baseDate],
                ["担当者", staffName],
              ]}
            />
          )}
        </>
      )}

      {category === "PAYROLL" && (
        <>
          {currentKey === "subType" && (
            <div>
              <QuestionTitle>給与タスクの種類を選択してください</QuestionTitle>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(Object.entries(PAYROLL_SUBTYPE_LABELS) as [PayrollSubType, string][]).map(([value, label]) => (
                  <ChoiceTile key={value} label={label} selected={payrollSubType === value} onClick={() => setPayrollSubType(value)} />
                ))}
              </div>
            </div>
          )}
          {currentKey === "client" && (
            <div>
              <QuestionTitle>対象のクライアントを選択してください</QuestionTitle>
              <ClientSelect clients={clients} value={clientId} onChange={setClientId} />
            </div>
          )}
          {currentKey === "target" && (
            <TargetNameStep
              value={targetName}
              onChange={setTargetName}
              onSkip={() => {
                setTargetName("");
                goNext();
              }}
            />
          )}
          {currentKey === "title" && (
            <div>
              <QuestionTitle>タスクのタイトルを入力してください(任意)</QuestionTitle>
              <TextField value={title} onChange={setTitle} placeholder={payrollComputedTitle} autoFocus />
            </div>
          )}
          {currentKey === "date" &&
            (payrollTemplate ? (
              <div>
                <QuestionTitle>{payrollTemplate.baseDateLabel}を起算日として入力してください(任意)</QuestionTitle>
                <p className="mt-1 text-sm text-slate-500">
                  未入力の場合は本日を起算日とし、テンプレート「{payrollTemplate.name}」のチェックリストと提出期限を自動生成します。
                </p>
                <DateField value={startDate} onChange={setStartDate} />
              </div>
            ) : (
              <div>
                <QuestionTitle>期限を入力してください(任意)</QuestionTitle>
                <DateField value={dueDate} onChange={setDueDate} />
              </div>
            ))}
          {currentKey === "assignee" && (
            <div>
              <QuestionTitle>担当者を選択してください(任意)</QuestionTitle>
              <StaffSelect staff={staff} value={assigneeId} onChange={setAssigneeId} />
              {!payrollTemplate && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700">メモ(任意)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          )}
          {currentKey === "confirm" && (
            <ConfirmScreen
              rows={[
                ["種別", `給与 / ${PAYROLL_SUBTYPE_LABELS[payrollSubType]}`],
                ["クライアント", clientName],
                ["対象者", targetName.trim() ? `${targetName.trim()} 様` : "未設定"],
                ["タイトル", title || payrollComputedTitle],
                payrollTemplate
                  ? [payrollTemplate.baseDateLabel, startDate || "本日"]
                  : ["期限", dueDate || "未設定"],
                ["担当者", staffName],
              ]}
            />
          )}
        </>
      )}

      {category === "GRANT" && (
        <>
          {currentKey === "client" && (
            <div>
              <QuestionTitle>対象のクライアントを選択してください</QuestionTitle>
              <ClientSelect clients={clients} value={clientId} onChange={setClientId} />
            </div>
          )}
          {currentKey === "target" && (
            <TargetNameStep
              value={targetName}
              onChange={setTargetName}
              onSkip={() => {
                setTargetName("");
                goNext();
              }}
            />
          )}
          {currentKey === "template" && (
            <div>
              <QuestionTitle>助成金の種類(テンプレート)を選択してください</QuestionTitle>
              <p className="mt-1 text-sm text-slate-500">
                選択したテンプレートのステップ(計画届提出→実施→支給申請→受給等)がチェックリストとして自動生成されます。
              </p>
              <div className="mt-4 space-y-2">
                {categoryTemplates.map((t) => (
                  <ChoiceTile
                    key={t.id}
                    label={t.name}
                    selected={templateId === t.id}
                    onClick={() => setTemplateId(t.id)}
                    fullWidth
                  />
                ))}
                {categoryTemplates.length === 0 && (
                  <p className="text-sm text-slate-400">
                    助成金テンプレートが登録されていません。先にテンプレート管理画面から作成してください。
                  </p>
                )}
              </div>
            </div>
          )}
          {currentKey === "title" && (
            <div>
              <QuestionTitle>タイトルを入力してください(任意)</QuestionTitle>
              <TextField value={title} onChange={setTitle} placeholder={grantComputedTitle} autoFocus />
            </div>
          )}
          {currentKey === "startDate" && (
            <div>
              <QuestionTitle>{selectedTemplateBaseDateLabel}を起算日として入力してください(任意)</QuestionTitle>
              <p className="mt-1 text-sm text-slate-500">未入力の場合は本日を起算日とし、各ステップの期限を自動計算します。</p>
              <DateField value={startDate} onChange={setStartDate} />
            </div>
          )}
          {currentKey === "assignee" && (
            <div>
              <QuestionTitle>担当者を選択してください(任意)</QuestionTitle>
              <StaffSelect staff={staff} value={assigneeId} onChange={setAssigneeId} />
            </div>
          )}
          {currentKey === "confirm" && (
            <ConfirmScreen
              rows={[
                ["種別", `助成金 / ${selectedTemplateName}`],
                ["クライアント", clientName],
                ["対象者", targetName.trim() ? `${targetName.trim()} 様` : "未設定"],
                ["タイトル", title || grantComputedTitle],
                [selectedTemplateBaseDateLabel, startDate || "本日"],
                ["担当者", staffName],
              ]}
            />
          )}
        </>
      )}

      {!isBuiltIn && category && (
        <>
          {currentKey === "client" && (
            <div>
              <QuestionTitle>対象のクライアントを選択してください</QuestionTitle>
              <ClientSelect clients={clients} value={clientId} onChange={setClientId} />
            </div>
          )}
          {currentKey === "target" && (
            <TargetNameStep
              value={targetName}
              onChange={setTargetName}
              onSkip={() => {
                setTargetName("");
                goNext();
              }}
            />
          )}
          {currentKey === "template" && (
            <div>
              <QuestionTitle>テンプレートを使用しますか?(任意)</QuestionTitle>
              <p className="mt-1 text-sm text-slate-500">
                テンプレートを選ぶと、そのステップがチェックリストとして自動生成されます。使わない場合はそのまま次へ進んでください。
              </p>
              <div className="mt-4 space-y-2">
                <ChoiceTile label="テンプレートを使わない" selected={!templateId} onClick={() => setTemplateId("")} fullWidth />
                {categoryTemplates.map((t) => (
                  <ChoiceTile
                    key={t.id}
                    label={t.name}
                    selected={templateId === t.id}
                    onClick={() => setTemplateId(t.id)}
                    fullWidth
                  />
                ))}
              </div>
            </div>
          )}
          {currentKey === "title" && (
            <div>
              <QuestionTitle>タイトルを入力してください(任意)</QuestionTitle>
              <TextField value={title} onChange={setTitle} placeholder={customComputedTitle} autoFocus />
            </div>
          )}
          {currentKey === "date" &&
            (templateId ? (
              <div>
                <QuestionTitle>{selectedTemplateBaseDateLabel}を起算日として入力してください(任意)</QuestionTitle>
                <p className="mt-1 text-sm text-slate-500">未入力の場合は本日を起算日とし、各ステップの期限を自動計算します。</p>
                <DateField value={startDate} onChange={setStartDate} />
              </div>
            ) : (
              <div>
                <QuestionTitle>期限を入力してください(任意)</QuestionTitle>
                <DateField value={dueDate} onChange={setDueDate} />
              </div>
            ))}
          {currentKey === "assignee" && (
            <div>
              <QuestionTitle>担当者を選択してください(任意)</QuestionTitle>
              <StaffSelect staff={staff} value={assigneeId} onChange={setAssigneeId} />
            </div>
          )}
          {currentKey === "confirm" && (
            <ConfirmScreen
              rows={[
                ["種別", templateId ? `${category} / ${selectedTemplateName}` : category],
                ["クライアント", clientName],
                ["対象者", targetName.trim() ? `${targetName.trim()} 様` : "未設定"],
                ["タイトル", title || customComputedTitle],
                templateId ? [selectedTemplateBaseDateLabel, startDate || "本日"] : ["期限", dueDate || "未設定"],
                ["担当者", staffName],
              ]}
            />
          )}
        </>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          戻る
        </button>
        {currentKey === "confirm" ? (
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? "作成中..." : "この内容でタスクを作成"}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canProceed()}
            onClick={goNext}
            className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            次へ
          </button>
        )}
      </div>
      <button type="button" onClick={() => router.push("/tasks")} className="mt-4 text-xs text-slate-400 hover:underline">
        キャンセルしてタスク一覧に戻る
      </button>
    </div>
  );
}

function QuestionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold text-slate-900">{children}</h2>;
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6">
      <p className="text-xs text-slate-400">
        ステップ {step + 1} / {total}
      </p>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function CategoryTile({ label, description, onClick }: { label: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-indigo-400 hover:bg-indigo-50"
    >
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </button>
  );
}

function ChoiceTile({
  label,
  selected,
  onClick,
  fullWidth,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-3 text-left text-sm font-medium ${fullWidth ? "w-full" : ""} ${
        selected ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function TargetNameStep({
  value,
  onChange,
  onSkip,
}: {
  value: string;
  onChange: (v: string) => void;
  onSkip: () => void;
}) {
  return (
    <div>
      <QuestionTitle>対象者を入力してください(任意)</QuestionTitle>
      <p className="mt-1 text-sm text-slate-500">
        個人が対象のタスクであれば、氏名を入力するとタスク名に反映されます。対象者がいない場合は入力せずに進んでください。
      </p>
      <TextField value={value} onChange={onChange} placeholder="例: 山田 太郎" autoFocus />
      <button
        type="button"
        onClick={onSkip}
        className="mt-3 text-xs text-slate-400 hover:text-slate-600 hover:underline"
      >
        対象者を入力せずに進む
      </button>
    </div>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="mt-4 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    />
  );
}

function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-4 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-64"
    />
  );
}

function ClientSelect({ clients, value, onChange }: { clients: Client[]; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-4 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-96"
    >
      <option value="" disabled>
        選択してください
      </option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

function StaffSelect({ staff, value, onChange }: { staff: Staff[]; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-4 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-96"
    >
      <option value="">未割当</option>
      {staff.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

function ConfirmScreen({ rows }: { rows: [string, string][] }) {
  return (
    <div>
      <QuestionTitle>この内容でタスクを作成します</QuestionTitle>
      <dl className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
