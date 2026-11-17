"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Milestone, Team } from "@/lib/types";

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

// 段階：足す・消す・順番を変える（owner と member）
export function MilestoneEditor({ teamId, milestones }: { teamId: string; milestones: Milestone[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const run = async (work: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await work;
    if (error) setMessage(error.message);
    router.refresh();
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const last = milestones[milestones.length - 1];
    await run(
      supabase.from("milestones").insert({ team_id: teamId, name, position: last ? last.position + 1 : 0 })
    );
    setName("");
  };

  // 隣の段階と position を入れ替える
  const swap = async (a: Milestone, b: Milestone) => {
    await run(supabase.from("milestones").update({ position: b.position }).eq("id", a.id));
    await run(supabase.from("milestones").update({ position: a.position }).eq("id", b.id));
  };

  const remove = async (m: Milestone) => {
    if (!confirm(`段階「${m.name}」を消しますか？（中のタスクは「段階なし」になります）`)) return;
    await run(supabase.from("milestones").delete().eq("id", m.id));
  };

  return (
    <div className="space-y-2">
      <ol className="space-y-1">
        {milestones.map((m, i) => (
          <li key={m.id} className="flex items-center gap-2 rounded border bg-white px-3 py-1">
            <span className="w-5 text-gray-500">{i + 1}</span>
            <span className="flex-1">{m.name}</span>
            <button disabled={i === 0} onClick={() => swap(m, milestones[i - 1])} className="px-1 disabled:opacity-30" aria-label="上へ">↑</button>
            <button disabled={i === milestones.length - 1} onClick={() => swap(m, milestones[i + 1])} className="px-1 disabled:opacity-30" aria-label="下へ">↓</button>
            <button onClick={() => remove(m)} className="px-1 text-red-600">消す</button>
          </li>
        ))}
      </ol>
      <form onSubmit={add} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="段階の名前（例：環境構築）"
          required
          className="flex-1 rounded border px-3 py-1"
        />
        <button className="rounded bg-gray-900 px-3 py-1 text-white hover:bg-gray-700">足す</button>
      </form>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </div>
  );
}

// チーム名とステータスの種類（owner だけ）
export function TeamEditor({ team }: { team: Team }) {
  const router = useRouter();
  const [name, setName] = useState(team.name);
  const [statusText, setStatusText] = useState(team.statuses.join("\n"));
  const [message, setMessage] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // 1行に1つ。空の行は捨てる
    const statuses = statusText.split("\n").map((s) => s.trim()).filter((s) => s !== "");
    if (statuses.length < 2) {
      setMessage("ステータスは2つ以上にしてください");
      return;
    }
    const { error } = await supabase.from("teams").update({ name, statuses }).eq("id", team.id);
    setMessage(error ? `保存できませんでした：${error.message}` : "保存しました");
    router.refresh();
  };

  return (
    <form onSubmit={save} className="space-y-2">
      <label className="block text-sm text-gray-600">チーム名</label>
      <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded border px-3 py-1" />
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
