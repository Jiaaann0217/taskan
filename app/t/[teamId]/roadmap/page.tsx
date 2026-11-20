import { loadTeam } from "@/lib/team-data";
import { daysBetween, isDone, milestoneProgress } from "@/lib/dashboard";
import type { Milestone, Task } from "@/lib/types";
import AppHeader from "../../../AppHeader";
import TeamNav from "../TeamNav";
import { AddMilestone, EditMilestone } from "./MilestoneForms";

export const dynamic = "force-dynamic";

// ロードマップ：段階を矢印でつないだ「作業の流れ」と、期間の帯（ガントチャート）
export default async function RoadmapPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const { supabase, team, canEdit } = await loadTeam(teamId);

  const [milestonesRes, tasksRes] = await Promise.all([
    supabase.from("milestones").select("*").eq("team_id", teamId).order("position"),
    supabase.from("tasks").select("*").eq("team_id", teamId).order("created_at"),
  ]);
  const milestones = (milestonesRes.data ?? []) as Milestone[];
  const tasks = (tasksRes.data ?? []) as Task[];

  const doneStatus = team.statuses[team.statuses.length - 1];
  const stages = milestoneProgress(milestones, tasks, doneStatus);
  const today = new Date();

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 text-gray-900 md:p-8">
      <AppHeader>
        <TeamNav teamId={team.id} teamName={team.name} current="roadmap" />
      </AppHeader>

      <p className="mb-4 text-sm text-gray-600">
        段階を左から順に進めます。期間と「この段階で作るもの」を決めておくと、全員が今どこにいるか分かります。
      </p>

      {/* 期間の帯 */}
      <Timeline milestones={milestones} goalDate={team.goal_date} today={today} />

      {/* 作業の流れ */}
      <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:overflow-x-auto md:pb-2">
        {stages.map((s, i) => {
          const m = s.milestone;
          const stageTasks = tasks.filter((t) => t.milestone_id === m.id);
          const late = m.due_date && s.progress.percent < 100 && daysBetween(m.due_date, today) >= 1;
          return (
            <div key={m.id} className="flex flex-col items-center gap-3 md:flex-row">
              <section
                className={`w-full rounded-lg border bg-white p-3 shadow-sm md:w-64 md:shrink-0 ${
                  s.isCurrent ? "border-blue-500 ring-2 ring-blue-200" : ""
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">段階 {i + 1}</span>
                  {s.isCurrent && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">いまここ</span>}
                  {s.progress.total > 0 && s.progress.percent === 100 && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">完了</span>
                  )}
                </div>
                <h2 className="font-bold">{m.name}</h2>
                <p className={`text-xs ${late ? "text-red-600" : "text-gray-500"}`}>
                  {m.start_date || m.due_date ? `${m.start_date ?? "?"} 〜 ${m.due_date ?? "?"}` : "期間未設定"}
                  {late && "（締め切りを過ぎた）"}
                </p>
                {m.description && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{m.description}</p>}

                <div className="mt-2 h-1.5 rounded bg-gray-200">
                  <div
                    className={`h-1.5 rounded ${s.progress.percent === 100 ? "bg-green-500" : "bg-blue-500"}`}
                    style={{ width: `${s.progress.percent}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{s.progress.done} / {s.progress.total} 完了</p>

                <ul className="mt-2 space-y-0.5 text-sm">
                  {stageTasks.map((t) => (
                    <li key={t.id} className={isDone(t, doneStatus) ? "text-gray-400 line-through" : ""}>
                      ・{t.title}
                    </li>
                  ))}
                </ul>

                {canEdit && <EditMilestone milestone={m} prev={milestones[i - 1]} next={milestones[i + 1]} />}
              </section>
              <span className="text-2xl text-gray-400" aria-hidden="true">
                <span className="md:hidden">↓</span>
                <span className="hidden md:inline">→</span>
              </span>
            </div>
          );
        })}

        {/* ゴール */}
        <section className="w-full rounded-lg border-2 border-dashed border-gray-400 bg-gray-50 p-3 md:w-56 md:shrink-0">
          <span className="text-xs text-gray-500">ゴール</span>
          <h2 className="font-bold">{team.goal ?? "（設定でゴールを決める）"}</h2>
          {team.goal_date && <p className="text-xs text-gray-500">{team.goal_date}</p>}
        </section>
      </div>

      {canEdit && (
        <section className="mt-6 max-w-xl rounded bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-bold">段階を足す</h2>
          <AddMilestone teamId={team.id} nextPosition={(milestones.at(-1)?.position ?? -1) + 1} />
        </section>
      )}
    </main>
  );
}

// 期間の帯。一番早い開始日から、一番遅い締め切り（またはゴール）までを横幅いっぱいに取る
function Timeline({ milestones, goalDate, today }: { milestones: Milestone[]; goalDate: string | null; today: Date }) {
  const dated = milestones.filter((m) => m.start_date && m.due_date);
  if (dated.length === 0) return null;

  const dayMs = 24 * 60 * 60 * 1000;
  const toTime = (d: string) => new Date(d).getTime();
  const begin = Math.min(...dated.map((m) => toTime(m.start_date!)));
  const end = Math.max(...dated.map((m) => toTime(m.due_date!)), goalDate ? toTime(goalDate) : 0) + dayMs;
  const pos = (t: number) => `${Math.min(100, Math.max(0, ((t - begin) / (end - begin)) * 100))}%`;
  const todayIn = today.getTime() >= begin && today.getTime() <= end;

  return (
    <section className="mb-6 rounded bg-white p-4 shadow-sm">
      <h2 className="mb-2 font-bold">期間</h2>
      <div className="relative space-y-1.5">
        {todayIn && (
          <div className="absolute top-0 bottom-0 z-10 w-px bg-red-500" style={{ left: pos(today.getTime()) }}>
            <span className="absolute -top-4 -translate-x-1/2 text-[10px] text-red-600">今日</span>
          </div>
        )}
        {dated.map((m) => {
          const s = toTime(m.start_date!);
          const e = toTime(m.due_date!) + dayMs;
          return (
            <div key={m.id} className="relative h-6 rounded bg-gray-100">
              <div
                className="absolute h-6 truncate rounded bg-blue-200 px-2 text-xs leading-6 text-blue-900"
                style={{ left: pos(s), width: `calc(${pos(e)} - ${pos(s)})` }}
              >
                {m.name}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
