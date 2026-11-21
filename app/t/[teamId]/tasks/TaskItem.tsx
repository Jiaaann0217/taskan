"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Milestone, Task, TeamMember } from "@/lib/types";
import TaskForm from "./TaskForm";
import { assigneeLabel } from "@/lib/assignee";
import type { PrInfo } from "@/lib/github";
import PrBadges from "../PrBadges";

type Props = {
  task: Task;
  statuses: string[];
  milestones: Milestone[];
  members: TeamMember[];
  roles: string[];
  repoUrl: string | null;
  canEdit: boolean;
  prs?: PrInfo[]; // GitHub の PR の状態（サーバーで読んだもの）
  readyToClose?: boolean; // PR が全部マージ済み → 「完了にする」を出す
};

// タスク1件の表示。ステータスはその場で切り替えられる。「直す」でフォームに変わる
export default function TaskItem({ task, statuses, milestones, members, roles, repoUrl, canEdit, prs = [], readyToClose = false }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  const doneStatus = statuses[statuses.length - 1]; // 一番右のステータスが「完了」
  const isDone = task.status === doneStatus;
  const assignee = assigneeLabel(task, members); // 例：「佐藤」「バックA（田中）」

  const changeStatus = async (status: string) => {
    await supabase.from("tasks").update({ status }).eq("id", task.id);
    router.refresh();
  };

  if (editing) {
    return (
      <TaskForm
        teamId={task.team_id}
        statuses={statuses}
        milestones={milestones}
        members={members}
        roles={roles}
        repoUrl={repoUrl}
        task={task}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className={`rounded border bg-white px-3 py-2 ${isDone ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`font-medium ${isDone ? "line-through" : ""}`}>{task.title}</span>
        {canEdit && (
          <button onClick={() => setEditing(true)} className="shrink-0 text-xs text-gray-500 hover:underline">
            直す
          </button>
        )}
      </div>
      {task.done_criteria && (
        <p className="mt-1 text-xs text-gray-600">完了の条件：{task.done_criteria}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {canEdit ? (
          <select
            value={task.status ?? statuses[0]}
            onChange={(e) => changeStatus(e.target.value)}
            className="rounded border px-1 py-0.5"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <span className="rounded border px-1 py-0.5">{task.status}</span>
        )}
        <span className="text-gray-600">{assignee}</span>
        {task.deadline && <span className="text-gray-600">締め切り {task.deadline}</span>}
        <PrBadges prs={prs} />
        {canEdit && readyToClose && !isDone && (
          <button onClick={() => changeStatus(doneStatus)} className="rounded bg-purple-600 px-2 py-0.5 text-white hover:bg-purple-700">
            PR はマージ済み → 完了にする
          </button>
        )}
      </div>
    </div>
  );
}
