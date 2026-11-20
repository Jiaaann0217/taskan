"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Team, TeamMember } from "@/lib/types";

// 招待コード。押すとコピーできる
export function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
      }}
      className="rounded border bg-white px-3 py-2 font-mono text-lg hover:bg-gray-50"
    >
      {code} <span className="text-xs text-gray-600">{copied ? "コピーしました" : "コピー"}</span>
    </button>
  );
}

// メンバーの役割を変える（owner だけ）。データベースの関数 set_member_role を呼ぶ（supabase/007）
export function RoleSelect({ teamId, userId, role }: { teamId: string; userId: string; role: TeamMember["role"] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  const change = async (newRole: string) => {
    const { error } = await supabase.rpc("set_member_role", {
      target_team_id: teamId,
      target_user_id: userId,
      new_role: newRole,
    });
    setMessage(error ? error.message : "");
    router.refresh();
  };

  return (
    <>
      <select value={role} onChange={(e) => change(e.target.value)} className="rounded border px-1 py-0.5">
        <option value="member">メンバー</option>
        <option value="assistant">AI</option>
      </select>
      {message && <span className="ml-2 text-red-600">{message}</span>}
    </>
  );
}

// チーム名・ゴール・GitHub・ステータスの種類（owner だけ）
export function TeamEditor({ team }: { team: Team }) {
  const router = useRouter();
  const [name, setName] = useState(team.name);
  const [statusText, setStatusText] = useState(team.statuses.join("\n"));
  const [goal, setGoal] = useState(team.goal ?? "");
  const [goalDate, setGoalDate] = useState(team.goal_date ?? "");
  const [repoUrl, setRepoUrl] = useState(team.repo_url ?? "");
  const [message, setMessage] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // 1行に1つ。空の行は捨てる
    const statuses = statusText.split("\n").map((s) => s.trim()).filter((s) => s !== "");
    if (statuses.length < 2) {
      setMessage("ステータスは2つ以上にしてください");
      return;
    }
    const { error } = await supabase
      .from("teams")
      .update({ name, statuses, goal: goal || null, goal_date: goalDate || null, repo_url: repoUrl || null })
      .eq("id", team.id);
    setMessage(error ? `保存できませんでした：${error.message}` : "保存しました");
    router.refresh();
  };

  return (
    <form onSubmit={save} className="space-y-2">
      <label className="block text-sm text-gray-600">チーム名</label>
      <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded border px-3 py-1" />
      <label className="block text-sm text-gray-600">ゴール（ダッシュボードの一番上に出る）</label>
      <div className="flex gap-2">
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="例：必須機能を完成させる"
          className="flex-1 rounded border px-3 py-1"
        />
        <input type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} className="rounded border px-3 py-1" />
      </div>
      <label className="block text-sm text-gray-600">
        GitHub リポジトリ（チームの決まりを置く場所。AI が質問に答えるときに読む）
      </label>
      <input
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        placeholder="https://github.com/〇〇/〇〇"
        className="w-full rounded border px-3 py-1"
      />
      <label className="block text-sm text-gray-600">
        ステータス（1行に1つ。上から順に進み、一番下が「完了」）
      </label>
      <textarea
        value={statusText}
        onChange={(e) => setStatusText(e.target.value)}
        rows={5}
        className="w-full rounded border px-3 py-1"
      />
      <p className="text-xs text-gray-500">名前を変えると、そのステータスだったタスクは選び直しが必要になります。</p>
      <button className="rounded bg-gray-900 px-3 py-1 text-white hover:bg-gray-700">保存</button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
  );
}
