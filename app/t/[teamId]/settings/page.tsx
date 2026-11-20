import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Milestone, Team, TeamMember } from "@/lib/types";
import AppHeader from "../../../AppHeader";
import TeamNav from "../TeamNav";
import { InviteCode, MilestoneEditor, TeamEditor } from "./SettingsForms";

export const dynamic = "force-dynamic";

const roleNames = { owner: "作った人", member: "メンバー", assistant: "AI" };

// ③ 設定：招待コード、メンバー、段階、チーム名とステータス
export default async function SettingsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const myId = claims?.claims?.sub;

  const [teamRes, milestonesRes, membersRes] = await Promise.all([
    supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
    supabase.from("milestones").select("*").eq("team_id", teamId).order("position"),
    supabase.from("team_members").select("*").eq("team_id", teamId).order("joined_at"),
  ]);

  const team = teamRes.data as Team | null;
  if (!team) notFound();
  const milestones = (milestonesRes.data ?? []) as Milestone[];
  const members = (membersRes.data ?? []) as TeamMember[];

  const myRole = members.find((m) => m.user_id === myId)?.role;
  const canEdit = myRole === "owner" || myRole === "member";

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
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.user_id} className="rounded border bg-white px-3 py-1">
                {m.display_name} <span className="text-sm text-gray-500">{roleNames[m.role]}</span>
                {m.user_id === myId && <span className="text-sm text-gray-500">（あなた）</span>}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-bold">段階</h2>
          {canEdit ? (
            <MilestoneEditor teamId={team.id} milestones={milestones} />
          ) : (
            <ol className="list-decimal pl-5">{milestones.map((m) => <li key={m.id}>{m.name}</li>)}</ol>
          )}
        </section>

        {myRole === "owner" && (
          <section>
            <h2 className="mb-2 font-bold">チーム名・ゴール・ステータス（作った人だけ）</h2>
            <TeamEditor team={team} />
          </section>
        )}
      </div>
    </main>
  );
}
