import Link from "next/link";
import AppHeader from "../AppHeader";
import JoinTeamForm from "../JoinTeamForm";

export const dynamic = "force-dynamic";

// 招待リンク：/join?code=A1C724C4 を開くと、参加欄にコードが入った状態になる
// ログインしていなければ、proxy.ts がログイン画面へ送り、ログイン後にここへ戻す
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;

  return (
    <main className="mx-auto min-h-screen max-w-md p-4 text-gray-900 md:p-8">
      <AppHeader />
      <section className="rounded border bg-white p-4">
        <h1 className="mb-1 text-lg font-bold">チームに参加</h1>
        <p className="mb-3 text-sm text-gray-600">チームでのあなたの表示名を入れて「参加」を押してください。</p>
        <JoinTeamForm initialCode={(code ?? "").toUpperCase()} />
      </section>
      <Link href="/" className="mt-4 block text-sm text-gray-500 hover:underline">
        ← トップへ
      </Link>
    </main>
  );
}
