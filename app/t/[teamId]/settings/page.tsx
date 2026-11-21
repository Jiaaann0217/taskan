import Link from "next/link";
import { loadTeam } from "@/lib/team-data";
import AppHeader from "../../../AppHeader";
import { InviteCode, RoleSelect, RolesEditor, StatusEditor, TeamEditor, TeamRoleSelect } from "./SettingsForms";

export const dynamic = "force-dynamic";

const roleNames = { owner: "作った人", member: "メンバー", assistant: "AI" };

// 設定：招待コード、メンバー（役割）、チーム名・ゴール・GitHub・ステータス
export default async function SettingsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const { team, members, myId, isOwner } = await loadTeam(teamId);

  return (
    <main className="min-h-screen w-full px-4 py-4 text-gray-900 md:px-8 md:py-6">
      <AppHeader team={{ id: team.id, name: team.name }} current="settings" />

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 font-bold">招待コード</h2>
          <p className="mb-2 text-sm text-gray-600">
            招待リンクを送ると、開いた人の参加欄にコードが入った状態になります。コードだけ送って、トップの「招待コードで参加」に打ってもらうこともできます。
          </p>
          <InviteCode code={team.invite_code} />
        </section>

        <section>
          <h2 className="mb-2 font-bold">メンバー（{members.length}人）</h2>
          <p className="mb-2 text-xs text-gray-500">
            「役割」（フロントA など）を選ぶと、その役割で担当を付けたタスクが、その人の担当になります。自分の役割は自分で選べます。
            {isOwner && " AI 用のアカウントは、権限を「AI」にしてください（読むことと質問箱に答えることだけできる）。"}
          </p>
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.user_id} className="flex flex-wrap items-center gap-2 rounded border bg-white px-3 py-1">
                <span>{m.display_name}</span>
                {m.user_id === myId && <span className="text-sm text-gray-500">（あなた）</span>}
                <span className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                  {m.role !== "assistant" && (isOwner || m.user_id === myId) ? (
                    <TeamRoleSelect
                      teamId={team.id}
                      userId={m.user_id}
                      value={m.team_role}
                      roles={team.roles}
                      isSelf={m.user_id === myId}
                    />
                  ) : (
                    m.team_role && <span>{m.team_role}</span>
                  )}
                  <span className="text-xs">権限：</span>
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
          <h2 className="mb-2 font-bold">役割</h2>
          <p className="mb-2 text-sm text-gray-600">
            メンバーがまだ参加していなくても、タスクの担当を役割で決めておけます。
          </p>
          {isOwner ? (
            <RolesEditor team={team} />
          ) : (
            <p className="text-sm">{team.roles.length ? team.roles.join("、") : "まだありません"}</p>
          )}
        </section>

        <section>
          <h2 className="mb-2 font-bold">段階</h2>
          <Link href={`/t/${team.id}/roadmap`} className="text-sm text-blue-700 hover:underline">
            段階の追加・期間・並べ替えは「ロードマップ」で →
          </Link>
        </section>

        {isOwner && (
          <section>
            <h2 className="mb-2 font-bold">チーム名・ゴール・GitHub（作った人だけ）</h2>
            <TeamEditor team={team} />
          </section>
        )}

        {isOwner && (
          <section>
            <h2 className="mb-2 font-bold">ステータス（作った人だけ）</h2>
            <StatusEditor team={team} />
          </section>
        )}
      </div>
    </main>
  );
}
