import Link from "next/link";
import { getMyClaims } from "@/lib/supabase-server";
import LogoutButton from "./LogoutButton";
import MobileMenu from "./MobileMenu";
import TeamNav, { teamTabs, type TeamTab } from "./t/[teamId]/TeamNav";

type Props = {
  // チームの中の画面なら、チーム名と今のタブを渡す
  team?: { id: string; name: string };
  current?: TeamTab;
};

// どの画面でも上に出す帯。画面の横幅いっぱいに広がり、スクロールしても上に残る
//   PC    ：1行目にアプリ名 / チーム名 …… メール・ログアウト、2行目にタブ
//   スマホ：1行目にアプリ名 / チーム名 …… ハンバーガー（中にタブ・メール・ログアウト）
// ページの main の余白（px-4 / md:px-8、上 py-4 / md:py-6）を打ち消して、端まで届かせている
export default async function AppHeader({ team, current }: Props) {
  const { email } = await getMyClaims();

  return (
    <header className="sticky top-0 z-20 -mx-4 -mt-4 mb-6 border-b bg-white md:-mx-8 md:-mt-6">
      <div className="relative flex items-center justify-between gap-3 px-4 py-2 md:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/" className="shrink-0 text-xl font-bold">
            Taskan
          </Link>
          {team && (
            <>
              <span className="text-gray-400">/</span>
              <Link href={`/t/${team.id}`} className="truncate font-bold hover:underline">
                {team.name}
              </Link>
            </>
          )}
        </div>
        <div className="hidden shrink-0 items-center gap-3 text-sm md:flex">
          {email && <span className="text-gray-600">{email}</span>}
          <LogoutButton />
        </div>
        <MobileMenu tabs={team ? teamTabs(team.id) : []} current={current} email={email} />
      </div>
      {team && current && <TeamNav teamId={team.id} current={current} />}
    </header>
  );
}
