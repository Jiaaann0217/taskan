import Link from "next/link";
import { loadTeam } from "@/lib/team-data";
import AppHeader from "../../../AppHeader";
import TeamNav from "../TeamNav";
import { InviteCode, RoleSelect, TeamEditor } from "./SettingsForms";

export const dynamic = "force-dynamic";

const roleNames = { owner: "作った人", member: "メンバー", assistant: "AI" };

// 設定：招待コード、メンバー（役割）、チーム名・ゴール・GitHub・ステータス
export default async function SettingsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const { team, members, myId, isOwner } = await loadTeam(teamId);

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 text-gray-900 md:p-8">
      <AppHeader>
        <TeamNav teamId={team.id} teamName={team.name} current="settings" />
      </AppHeader>

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 font-bold">招待コード</h2>
          <p className="mb-2 text-sm text-gray-600">メンバーに送ると、トップの「招待コードで参加」から入れます。</p>
          <InviteCode code={team.invite_code} />
        </section>

        <section>
          <h2 className="mb-2 font-bold">メンバー（{members.length}人）</h2>
          {isOwner && (
            <p className="mb-2 text-xs text-gray-500">
              AI 用のアカウントを招待コードで参加させたら、役割を「AI」にしてください。AI は読むことと質問箱に答えることだけできます。
            </p>
          )}
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center gap-2 rounded border bg-white px-3 py-1">
                <span>{m.display_name}</span>
                {m.user_id === myId && <span className="text-sm text-gray-500">（あなた）</span>}
                <span className="ml-auto text-sm text-gray-500">
                  {isOwner && m.role !== "owner" ? (
                    <RoleSelect teamId={team.id} userId={m.user_id} role={m.role} />
                  ) : (
                    roleNames[m.role]
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-bold">段階</h2>
          <Link href={`/t/${team.id}/roadmap`} className="text-sm text-blue-700 hover:underline">
            段階の追加・期間・並べ替えは「ロードマップ」で →
          </Link>
        </section>

        {isOwner && (
          <section>
            <h2 className="mb-2 font-bold">チーム名・ゴール・GitHub・ステータス（作った人だけ）</h2>
            <TeamEditor team={team} />
          </section>
        )}
      </div>
    </main>
  );
}
