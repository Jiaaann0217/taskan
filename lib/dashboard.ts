// ダッシュボードの計算をする関数
// データベースにもブラウザにも頼らない「ただの計算」。タスクの配列を入れると答えが返る
import type { Milestone, Task, TeamMember } from "@/lib/types";

// 何日動きがなければ「止まっている」とするか
export const IDLE_DAYS = 5;

// 確認待ち（PR レビュー待ちなど）のまま何日たてば「止まっている」とするか
export const REVIEW_DAYS = 2;

// ── 道具（AI が書いた）──────────────────────────

// from の日時から to まで、何日たったか（小数は切り捨て）
// 例：daysBetween("2026-11-10", new Date("2026-11-17")) → 7
export function daysBetween(from: string, to: Date): number {
  const ms = to.getTime() - new Date(from).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// 完了したか（チームのステータスの一番右が「完了」）
export function isDone(task: Task, doneStatus: string): boolean {
  return task.status === doneStatus;
}

// ── 全体と段階（AI が書いた）────────────────────────

export type Progress = { done: number; total: number; percent: number };

export function calcProgress(tasks: Task[], doneStatus: string): Progress {
  const done = tasks.filter((t) => isDone(t, doneStatus)).length;
  const total = tasks.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}

export type MilestoneProgress = { milestone: Milestone; progress: Progress; isCurrent: boolean };

// 段階ごとの進み具合。100％でない最初の段階に「いまここ」の印を付ける
export function milestoneProgress(milestones: Milestone[], tasks: Task[], doneStatus: string): MilestoneProgress[] {
  const list = milestones.map((m) => ({
    milestone: m,
    progress: calcProgress(tasks.filter((t) => t.milestone_id === m.id), doneStatus),
    isCurrent: false,
  }));
  const current = list.find((x) => x.progress.total === 0 || x.progress.percent < 100);
  if (current) current.isCurrent = true;
  return list;
}

// 今週やること：締め切りが今日から7日以内で、まだ完了していない（締め切りの近い順）
export function tasksThisWeek(tasks: Task[], doneStatus: string, today: Date): Task[] {
  return tasks
    .filter((t) => !isDone(t, doneStatus) && t.deadline !== null)
    .filter((t) => {
      const left = -daysBetween(t.deadline!, today); // 締め切りまであと何日
      return left >= 0 && left <= 7;
    })
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!));
}

// ── ★本人が書く①：findStuckTasks ──────────────────────

// 止まっているタスク1件分。reason は理由、days は何日か
export type StuckTask = {
  task: Task;
  reason: "overdue" | "idle" | "review"; // overdue：締め切りを過ぎた　idle：IDLE_DAYS 日以上動きなし　review：確認待ちのまま REVIEW_DAYS 日以上（AI が 11/21 に追加）
  days: number;               // overdue なら締め切りから何日過ぎたか、idle なら何日動きがないか
};

// 目的：止まっているタスクを選んで返す
// 決まり：
//   1. 完了したタスクは選ばない
//   2. 締め切りがあって、締め切りから1日以上たっている → reason: "overdue"
//   3. 2 でなく、updated_at から IDLE_DAYS 日以上たっている → reason: "idle"
//   4. どちらでもなければ選ばない
// 使える道具：isDone(task, doneStatus)、daysBetween(日付の文字列, today)
export function findStuckTasks(tasks: Task[], doneStatus: string, today: Date): StuckTask[] {
  const result: StuckTask[] = [];

  // TODO：tasks を1件ずつ見て、決まりに当てはまるものを result に足す
  //   1件ずつ見る形：for (const task of tasks) { ... }
  //   足す形：result.push({ task: task, reason: "overdue", days: 何日 });
  //   次の1件へ飛ばす形：continue;
  for(const task of tasks){
    if(isDone(task, doneStatus)){
      continue;
    }
    if (task.deadline != null) {
      const overdueDays = daysBetween(task.deadline, today);
      if (overdueDays >= 1) {
        result.push({ task: task, reason:"overdue", days: overdueDays });
        continue;
      }
    }

    // ③ ④ 何日動きがないか
    const idleDays = daysBetween(task.updated_at, today);
    if (idleDays >= IDLE_DAYS) {
      result.push({ task: task, reason:"idle", days: idleDays });
    }
  }
  
  return result;
}

// ── ★本人が書く②：countByMember ──────────────────────

// メンバー1人分の数
export type MemberCount = {
  member: TeamMember;
  open: number;  // まだ完了していない
  done: number;  // 完了した
  stuck: number; // 止まっている（findStuckTasks の結果に入っている）
};

// 目的：メンバーごとに、担当タスクの数を数える
// 決まり：
//   - AI（role が "assistant"）は数えない
//   - 担当は task.assignee_user_id と member.user_id が同じもの
// 使える道具：isDone(task, doneStatus)、配列の filter と length
export function countByMember(
  tasks: Task[],
  members: TeamMember[],
  doneStatus: string,
  stuck: StuckTask[]
): MemberCount[] {
  // TODO：members から AI を除き、1人ずつ MemberCount を作って返す
  //   形：return members.filter(...).map((member) => { ...; return { member, open: ..., done: ..., stuck: ... }; });
  //   stuck の数え方のヒント：stuck は StuckTask の配列。中の s.task.assignee_user_id 
  return members
    .filter((member) => member.role !== "assistant")       // AI を除く
    .map((member) => {
      // この人が担当のタスクだけ集める
      const mine = tasks.filter((t) => t.assignee_user_id === member.user_id);

      return {
        member: member,
        open: mine.filter((t) => !isDone(t, doneStatus)).length,   // 未完了（私が書いた。お手本）
        done: mine.filter((t) => isDone(t,doneStatus)).length,     // 完了
        stuck: stuck.filter((s) => s.task.assignee_user_id ===　member.user_id).length, // 止まっている
      };
    });
}

// ── 確認待ち（AI が 11/21 に追加）────────────────────────

// 確認待ちのステータス：完了のひとつ手前（例：「PR 確認中」）。ステータスが2つしかなければ、ない
export function reviewStatusOf(statuses: string[]): string | null {
  return statuses.length >= 3 ? statuses[statuses.length - 2] : null;
}

export type ReviewTask = { task: Task; days: number }; // days：最後に変わってから何日

// 確認待ちのタスク（長く待っている順）
export function reviewWaiting(tasks: Task[], statuses: string[], today: Date): ReviewTask[] {
  const reviewStatus = reviewStatusOf(statuses);
  if (!reviewStatus) return [];
  return tasks
    .filter((t) => t.status === reviewStatus)
    .map((t) => ({ task: t, days: daysBetween(t.updated_at, today) }))
    .sort((a, b) => b.days - a.days);
}

// 止まっているもの（findStuckTasks の結果）に、確認待ちのまま REVIEW_DAYS 日以上のものを足す。
// すでに入っているタスク（期限切れなど）は二重に数えない
export function addReviewStuck(stuck: StuckTask[], review: ReviewTask[]): StuckTask[] {
  const already = new Set(stuck.map((s) => s.task.id));
  const extra = review
    .filter((r) => r.days >= REVIEW_DAYS && !already.has(r.task.id))
    .map((r) => ({ task: r.task, reason: "review" as const, days: r.days }));
  return [...stuck, ...extra];
}
