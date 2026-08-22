import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-center text-xl font-bold text-slate-900">社労士業務タスク管理</h1>
        <p className="mt-1 text-center text-sm text-slate-500">事務所スタッフ用ログイン</p>
        <div className="mt-6">
          <LoginForm nextPath={nextPath} />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          デモ: tanaka@example-sr.jp / password123
        </p>
      </div>
    </div>
  );
}
