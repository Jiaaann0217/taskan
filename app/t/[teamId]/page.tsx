import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Milestone, Task, Team, TeamMember } from "@/lib/types";
import {
  IDLE_DAYS,
  REVIEW_DAYS,
  addReviewStuck,
  calcProgress,
  countByMember,
  daysBetween,
  findStuckTasks,
  milestoneProgress,
  reviewStatusOf,
  reviewWaiting,
  tasksThisWeek,
} from "@/lib/dashboard";
import AppHeader from "../../AppHeader";
import { assigneeLabel, withResolvedAssignees } from "@/lib/assignee";
import { loadPrs, readyToClose } from "@/lib/github";
import PrBadges from "./PrBadges";

export const dynamic = "force-dynamic";

// ダッシュボード：開いた瞬間に「どこまで進んだか／次に何をやるか／誰が止まっているか」が分かる
export default async function DashboardPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createSupabaseServerClient();

  const [teamRes, milestonesRes, tasksRes, membersRes, openQuestionsRes] = await Promise.all([
    supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
    supabase.from("milestones").select("*").eq("team_id", teamId).order("position"),
    supabase.from("tasks").select("*").eq("team_id", teamId),
    supabase.from("team_members").select("*").eq("team_id", teamId).order("joined_at"),
    // 質問箱で、まだ解決していない質問（status の列だけ取る）
    supabase.from("questions").select("status").eq("team_id", teamId).neq("status", "resolved"),
  ]);
  const openQuestions = (openQuestionsRes.data ?? []) as { status: string }[];
  const unanswered = openQuestions.filter((q) => q.status === "open").length;

  // 読み出しの失敗は 404 にしない（error.tsx へ）。空なら「メンバーではない」→ 404
  if (teamRes.error) throw new Error(`チームを読めませんでした：${teamRes.error.message}`);
  const team = teamRes.data as Team | null;
  if (!team) notFound();
  const milestones = (milestonesRes.data ?? []) as Milestone[];
  // 役割で担当を付けたタスクも、その役割のメンバーの担当として数える（lib/assignee.ts）
  const tasks = withResolvedAssignees((tasksRes.data ?? []) as Task[], (membersRes.data ?? []) as TeamMember[]);
  const members = (membersRes.data ?? []) as TeamMember[];

  // ここから計算（lib/dashboard.ts）
  const today = new Date();
  const doneStatus = team.statuses[team.statuses.length - 1];
  const overall = calcProgress(tasks, doneStatus);
  const stages = milestoneProgress(milestones, tasks, doneStatus);
  const thisWeek = tasksThisWeek(tasks, doneStatus, today);
  const review = reviewWaiting(tasks, team.statuses, today); // 確認待ち（完了のひとつ手前）
  // GitHub の PR の状態は、まだ完了していないタスクの分だけ読む（lib/github.ts）
  const prs = await loadPrs(tasks.filter((t) => t.status !== doneStatus), team.repo_url);
  const mergedNotDone = tasks.filter((t) => t.status !== doneStatus && readyToClose(prs[t.id] ?? []));
  const reviewStatus = reviewStatusOf(team.statuses);
  // ★本人の findStuckTasks に、確認待ちのまま REVIEW_DAYS 日以上のものを足す
  const stuck = addReviewStuck(findStuckTasks(tasks, doneStatus, today), review);
  const byMember = countByMember(tasks, members, doneStatus, stuck); // ★本人

  const daysLeft = team.goal_date ? -daysBetween(team.goal_date, today) : null;

  return (
    <main className="min-h-screen w-full px-4 py-4 text-gray-900 md:px-8 md:py-6">
      <AppHeader team={{ id: team.id, name: team.name }} current="dashboard" />

      {/* 上の3つの数字 */}
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <div className="rounded bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">ゴール</div>
          {team.goal ? (
            <>
              <div className="font-bold">{team.goal}</div>
              {daysLeft !== null && (
                <div className="text-xs text-gray-500">
                  {daysLeft >= 0 ? `あと ${daysLeft}日（${team.goal_date}）` : `${-daysLeft}日 過ぎた`}
                </div>
              )}
            </>
          ) : (
            <Link href={`/t/${team.id}/settings`} className="text-sm text-gray-500 hover:underline">
              「設定」でゴールを決める
            </Link>
          )}
        </div>
        <div className="rounded bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">全体の進み具合</div>
          <div className="text-2xl font-bold">{overall.percent}%</div>
          <Bar percent={overall.percent} />
          <div className="mt-1 text-xs text-gray-500">{overall.done} / {overall.total} 完了</div>
        </div>
        <div className="rounded bg-white p-4 shadow-sm">
          <div className="text-xs text-gray-500">止まっているもの</div>
          <div className={`text-2xl font-bold ${stuck.length > 0 ? "text-red-600" : ""}`}>{stuck.length}</div>
          <div className="text-xs text-gray-500">
            期限切れ {stuck.filter((s) => s.reason === "overdue").length} ・ {IDLE_DAYS}日動きなし{" "}
            {stuck.filter((s) => s.reason === "idle").length}
            {reviewStatus && <> ・ 確認待ち{REVIEW_DAYS}日以上 {stuck.filter((s) => s.reason === "review").length}</>}
          </div>
        </div>
        <Link href={`/t/${team.id}/questions`} className="rounded bg-white p-4 shadow-sm hover:bg-gray-50">
          <div className="text-xs text-gray-500">質問箱</div>
          <div className={`text-2xl font-bold ${unanswered > 0 ? "text-yellow-600" : ""}`}>{unanswered}</div>
          <div className="text-xs text-gray-500">
            未回答 {unanswered} ・ 解決待ち {openQuestions.length - unanswered}
          </div>
        </Link>
      </div>

      {/* 段階 */}
      <section className="mb-6 rounded bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold">
          段階{" "}
          <Link href={`/t/${team.id}/roadmap`} className="text-sm font-normal text-gray-500 hover:underline">
            ロードマップを見る →
          </Link>
        </h2>
        {stages.length === 0 ? (
          <Link href={`/t/${team.id}/settings`} className="text-sm text-gray-500 hover:underline">
            「設定」で段階を作ると、ここに進み具合が出ます
          </Link>
        ) : (
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 text-sm">
            {stages.map((s, i) => (
              <div key={s.milestone.id} className="contents">
                <span className={s.isCurrent ? "font-bold" : ""}>
                  {i + 1} {s.milestone.name}
                  {s.isCurrent && (
                    <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">いまここ</span>
                  )}
                </span>
                <Bar percent={s.progress.percent} done={s.progress.percent === 100} />
                <span className="text-gray-500">{s.progress.done}/{s.progress.total}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 今週やること・止まっているもの */}
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <section className="rounded bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-bold">今週やること</h2>
          {thisWeek.length === 0 ? (
            <p className="text-sm text-gray-500">締め切りが7日以内のタスクはありません</p>
          ) : (
            <ul className="divide-y text-sm">
              {thisWeek.map((t) => (
                <li key={t.id} className="py-1.5">
                  {t.title}{" "}
                  <span className="text-xs text-gray-500">{assigneeLabel(t, members)} ・ {t.deadline}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={`rounded bg-white p-4 shadow-sm ${stuck.length > 0 ? "ring-1 ring-red-300" : ""}`}>
          <h2 className="mb-2 font-bold">止まっているもの</h2>
          {stuck.length === 0 ? (
            <p className="text-sm text-gray-500">ありません</p>
          ) : (
            <ul className="divide-y text-sm">
              {stuck.map((s) => (
                <li key={s.task.id} className="py-1.5">
                  {s.task.title}{" "}
                  <span className={`text-xs ${s.reason === "overdue" ? "text-red-600" : "text-gray-500"}`}>
                    {s.reason === "overdue"
                      ? `締め切りを ${s.days}日 過ぎた`
                      : s.reason === "review"
                        ? `${reviewStatus}のまま ${s.days}日`
                        : `${s.days}日 動きなし`}
                    {" ・ "}{assigneeLabel(s.task, members)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* PR がマージ済みなのに、まだ完了にしていないタスク（完了にしてよいもの） */}
      {mergedNotDone.length > 0 && (
        <section className="mb-6 rounded bg-purple-50 p-4 shadow-sm ring-1 ring-purple-200">
          <h2 className="mb-1 font-bold">
            PR はマージ済み（完了にしてよい） <span className="text-sm font-normal text-gray-500">{mergedNotDone.length}件</span>
          </h2>
          <p className="mb-2 text-xs text-gray-600">「タスク一覧」で「完了にする」を押すか、ステータスを完了にしてください。</p>
          <ul className="divide-y text-sm">
            {mergedNotDone.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 py-1.5">
                {t.title}
                <span className="text-xs text-gray-500">{assigneeLabel(t, members)}</span>
                <span className="flex flex-wrap gap-1 text-xs"><PrBadges prs={prs[t.id] ?? []} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 確認待ち（PR のレビュー待ちなど）。止まる前から見えるように、全部出す */}
      {reviewStatus && (
        <section className="mb-6 rounded bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-bold">
            {reviewStatus} <span className="text-sm font-normal text-gray-500">{review.length}件</span>
          </h2>
          {review.length === 0 ? (
            <p className="text-sm text-gray-500">ありません</p>
          ) : (
            <ul className="divide-y text-sm">
              {review.map((r) => (
                <li key={r.task.id} className="flex flex-wrap items-center gap-2 py-1.5">
                  {r.task.title}
                  <span className={`text-xs ${r.days >= REVIEW_DAYS ? "text-red-600" : "text-gray-500"}`}>
                    {r.days === 0 ? "今日から" : `${r.days}日 待ち`} ・ {assigneeLabel(r.task, members)}
                  </span>
                  <span className="flex flex-wrap gap-1 text-xs"><PrBadges prs={prs[r.task.id] ?? []} /></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* メンバー */}
      <section className="rounded bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-bold">メンバー</h2>
        {byMember.length === 0 ? (
          <p className="text-sm text-gray-500">まだ数えられていません（countByMember を書くと出ます）</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            {byMember.map((c) => (
              <div key={c.member.user_id} className="rounded bg-gray-50 p-2">
                <div className="font-bold">{c.member.display_name}</div>
                <div className="text-xs text-gray-600">
                  残り {c.open} ・ 完了 {c.done}
                  {c.stuck > 0 && <span className="text-red-600"> ・ 止まっている {c.stuck}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// 進み具合の棒
function Bar({ percent, done = false }: { percent: number; done?: boolean }) {
  return (
    <div className="h-1.5 w-full rounded bg-gray-200">
      <div
        className={`h-1.5 rounded ${done ? "bg-green-500" : "bg-blue-500"}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
