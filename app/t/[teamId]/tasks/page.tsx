import { notFound } from "next/navigation";
import { createSupabaseServerClient, getMyClaims } from "@/lib/supabase-server";
import type { Milestone, Task, Team, TeamMember } from "@/lib/types";
import AppHeader from "../../../AppHeader";
import TeamNav from "../TeamNav";
import AddTaskButton from "./AddTaskButton";
import TaskItem from "./TaskItem";

export const dynamic = "force-dynamic";

// タスク一覧：タスクを段階ごとに並べる
export default async function TasksPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params; // URL の /t/〇〇 の〇〇
  const supabase = await createSupabaseServerClient();
  const { id: myId } = await getMyClaims();

  // 4つの表を同時に読む。どれもルール（RLS）で「メンバーだけ」に絞られている
  const [teamRes, milestonesRes, tasksRes, membersRes] = await Promise.all([
    supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
    supabase.from("milestones").select("*").eq("team_id", teamId).order("position"),
    supabase.from("tasks").select("*").eq("team_id", teamId).order("created_at"),
    supabase.from("team_members").select("*").eq("team_id", teamId).order("joined_at"),
  ]);

  // メンバーでなければ、門番のおかげで team は空で返ってくる → 「見つかりません」
  const team = teamRes.data as Team | null;
  if (!team) notFound();

  const milestones = (milestonesRes.data ?? []) as Milestone[];
  const tasks = (tasksRes.data ?? []) as Task[];
  const members = (membersRes.data ?? []) as TeamMember[];

  const myRole = members.find((m) => m.user_id === myId)?.role;
  const canEdit = myRole === "owner" || myRole === "member";
  const doneStatus = team.statuses[team.statuses.length - 1];

  // 段階ごとに分ける。段階が決まっていないタスクは「段階なし」へ
  const groups = [
    ...milestones.map((m) => ({ id: m.id as string | null, name: m.name })),
    { id: null, name: "段階なし" },
  ].map((g) => ({ ...g, tasks: tasks.filter((t) => t.milestone_id === g.id) }));

  const doneCount = tasks.filter((t) => t.status === doneStatus).length;

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 text-gray-900 md:p-8">
      <AppHeader>
        <TeamNav teamId={team.id} teamName={team.name} current="tasks" />
      </AppHeader>

      <p className="mb-6 text-sm text-gray-600">
        全体：{doneCount} / {tasks.length} 完了
        {milestones.length === 0 && "　（段階は「設定」で作れます）"}
      </p>

      <div className="space-y-6">
        {groups
          .filter((g) => g.id !== null || g.tasks.length > 0 || milestones.length === 0)
          .map((g) => {
            const done = g.tasks.filter((t) => t.status === doneStatus).length;
            return (
              <section key={g.id ?? "none"}>
                <h2 className="mb-2 font-bold">
                  {g.name} <span className="text-sm font-normal text-gray-600">{done}/{g.tasks.length}</span>
                </h2>
                <div className="space-y-2">
                  {g.tasks.map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      statuses={team.statuses}
                      milestones={milestones}
                      members={members}
                      canEdit={canEdit}
                    />
                  ))}
                  {canEdit && (
                    <AddTaskButton
                      teamId={team.id}
                      statuses={team.statuses}
                      milestones={milestones}
                      members={members}
                      milestoneId={g.id}
                    />
                  )}
                </div>
              </section>
            );
          })}
      </div>
    </main>
  );
}
