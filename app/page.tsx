import Link from "next/link";
import { getMyTeams } from "@/lib/teams";
import AppHeader from "./AppHeader";
import CreateTeamForm from "./CreateTeamForm";
import JoinTeamForm from "./JoinTeamForm";

export const dynamic = "force-dynamic";

// ① トップ：自分のチーム一覧、チームを作る、招待コードで参加
export default async function Home() {
  const teams = await getMyTeams(); // ★本人が書いた関数

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 text-gray-900 md:p-8">
      <AppHeader />

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-bold">あなたのチーム</h2>
        {teams.length === 0 ? (
          <p className="text-gray-600">まだチームに入っていません。下で作るか、招待コードで参加してください。</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((team) => (
              <li key={team.id}>
                <Link
                  href={`/t/${team.id}`}
                  className="block rounded border bg-white px-4 py-3 hover:bg-gray-50"
                >
                  {team.name} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded border bg-white p-4">
          <h2 className="mb-2 font-bold">チームを作る</h2>
          <CreateTeamForm />
        </section>
        <section className="rounded border bg-white p-4">
          <h2 className="mb-2 font-bold">招待コードで参加</h2>
          <JoinTeamForm />
        </section>
      </div>
    </main>
  );
}
