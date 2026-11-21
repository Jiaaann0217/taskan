"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Milestone, Task, TeamMember } from "@/lib/types";
import { assigneeValue, parseAssigneeValue } from "@/lib/assignee";

type Props = {
  teamId: string;
  statuses: string[];
  milestones: Milestone[];
  members: TeamMember[];
  roles: string[]; // チームの役割（例：フロントA）。担当を役割で付けられる
  task?: Task; // あれば「直す」、なければ「足す」
  defaultMilestoneId?: string | null;
  onDone: () => void; // 保存・取り消しのあとに呼ぶ（フォームを閉じる）
};

// タスクを足す・直すフォーム。「完了の条件」の欄がある
export default function TaskForm({
  teamId,
  statuses,
  milestones,
  members,
  roles,
  task,
  defaultMilestoneId = null,
  onDone,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(task?.title ?? "");
  const [doneCriteria, setDoneCriteria] = useState(task?.done_criteria ?? "");
  const [milestoneId, setMilestoneId] = useState(task?.milestone_id ?? defaultMilestoneId ?? "");
  const [assignee, setAssignee] = useState(assigneeValue(task)); // "user:<id>" か "role:<役割>" か ""
  const [status, setStatus] = useState(task?.status ?? statuses[0]);
  const [deadline, setDeadline] = useState(task?.deadline ?? "");
  const [message, setMessage] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // 空欄は null にしてデータベースへ送る
    const row = {
      team_id: teamId,
      title,
      done_criteria: doneCriteria || null,
      milestone_id: milestoneId || null,
      ...parseAssigneeValue(assignee),
      status,
      deadline: deadline || null,
    };

    const { error } = task
      ? await supabase.from("tasks").update(row).eq("id", task.id)
      : await supabase.from("tasks").insert(row);

    if (error) {
      setMessage(`保存できませんでした：${error.message}`);
      return;
    }
    onDone();
    router.refresh(); // サーバーからもう一度読み直して、画面を新しくする
  };

  const handleDelete = async () => {
    if (!task || !confirm(`「${task.title}」を消しますか？`)) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) {
      setMessage(`消せませんでした：${error.message}`);
      return;
    }
    onDone();
    router.refresh();
  };

  return (
    <form onSubmit={handleSave} className="space-y-2 rounded border bg-gray-50 p-3 text-sm">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="やること（例：ログイン画面）"
        required
        className="w-full rounded border bg-white px-2 py-1"
      />
      <textarea
        value={doneCriteria}
        onChange={(e) => setDoneCriteria(e.target.value)}
        placeholder="完了の条件（例：登録 → ログイン → ホームに移れる）"
        rows={2}
        className="w-full rounded border bg-white px-2 py-1"
      />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} className="rounded border bg-white px-2 py-1">
          <option value="">段階なし</option>
          {milestones.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="rounded border bg-white px-2 py-1">
          <option value="">担当なし</option>
          {roles.length > 0 && (
            <optgroup label="役割で">
              {roles.map((r) => {
                const holder = members.find((m) => m.team_role === r);
                return (
                  <option key={r} value={`role:${r}`}>{r}{holder ? `（${holder.display_name}）` : ""}</option>
                );
              })}
            </optgroup>
          )}
          <optgroup label="人で">
            {members
              .filter((m) => m.role !== "assistant")
              .map((m) => (
                <option key={m.user_id} value={`user:${m.user_id}`}>{m.display_name}</option>
              ))}
          </optgroup>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border bg-white px-2 py-1">
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="rounded border bg-white px-2 py-1"
        />
      </div>
      <div className="flex gap-2">
        <button className="rounded bg-gray-900 px-3 py-1 text-white hover:bg-gray-700">
          {task ? "保存" : "足す"}
        </button>
        <button type="button" onClick={onDone} className="rounded border px-3 py-1 hover:bg-white">
          やめる
        </button>
        {task && (
          <button type="button" onClick={handleDelete} className="ml-auto rounded px-3 py-1 text-red-600 hover:bg-red-50">
            消す
          </button>
        )}
      </div>
      {message && <p className="text-red-600">{message}</p>}
    </form>
  );
}
