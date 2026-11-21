// タスクの担当を決める（人で付けたか、役割で付けたか）
// 担当の人（assignee_user_id）があればその人。なければ、担当の役割（assignee_role）を受け持つメンバー
import type { Task, TeamMember } from "@/lib/types";

// 担当の人の id（役割で付けたタスクは、その役割のメンバー。まだいなければ null）
export function resolveAssignee(task: Task, members: TeamMember[]): string | null {
  if (task.assignee_user_id) return task.assignee_user_id;
  if (!task.assignee_role) return null;
  return members.find((m) => m.team_role === task.assignee_role)?.user_id ?? null;
}

// 役割で付けたタスクにも assignee_user_id を入れた配列（ダッシュボードの数え方をそのまま使うため）
export function withResolvedAssignees(tasks: Task[], members: TeamMember[]): Task[] {
  return tasks.map((t) => ({ ...t, assignee_user_id: resolveAssignee(t, members) }));
}

// 画面に出す担当の名前。例：「佐藤」「バックA（田中）」「バックA（まだいない）」「担当なし」
export function assigneeLabel(task: Task, members: TeamMember[]): string {
  if (task.assignee_user_id) {
    return members.find((m) => m.user_id === task.assignee_user_id)?.display_name ?? "（抜けた人）";
  }
  if (task.assignee_role) {
    const m = members.find((x) => x.team_role === task.assignee_role);
    return `${task.assignee_role}（${m ? m.display_name : "まだいない"}）`;
  }
  return "担当なし";
}

// 担当の選択肢の値。"role:バックA" か "user:<id>" か ""（担当なし）
export function assigneeValue(task: Pick<Task, "assignee_user_id" | "assignee_role"> | undefined): string {
  if (task?.assignee_user_id) return `user:${task.assignee_user_id}`;
  if (task?.assignee_role) return `role:${task.assignee_role}`;
  return "";
}

export function parseAssigneeValue(value: string): { assignee_user_id: string | null; assignee_role: string | null } {
  if (value.startsWith("user:")) return { assignee_user_id: value.slice(5), assignee_role: null };
  if (value.startsWith("role:")) return { assignee_user_id: null, assignee_role: value.slice(5) };
  return { assignee_user_id: null, assignee_role: null };
}
