"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Milestone } from "@/lib/types";

type Fields = { name: string; start_date: string; due_date: string; description: string };

// 段階の入力欄（足す・直すで共通）
function MilestoneFields({ value, onChange }: { value: Fields; onChange: (v: Fields) => void }) {
  return (
    <div className="space-y-2 text-sm">
      <input
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="段階の名前（例：認証）"
        required
        className="w-full rounded border px-2 py-1"
      />
      <div className="flex items-center gap-1">
        <input type="date" value={value.start_date} onChange={(e) => onChange({ ...value, start_date: e.target.value })} className="flex-1 rounded border px-2 py-1" />
        〜
        <input type="date" value={value.due_date} onChange={(e) => onChange({ ...value, due_date: e.target.value })} className="flex-1 rounded border px-2 py-1" />
      </div>
      <textarea
        value={value.description}
        onChange={(e) => onChange({ ...value, description: e.target.value })}
        placeholder="この段階で作るもの（例：ログイン・新規登録・ログアウトができる）"
        rows={2}
        className="w-full rounded border px-2 py-1"
      />
    </div>
  );
}

// 空欄は null にしてデータベースへ送る
const toRow = (v: Fields) => ({
  name: v.name,
  start_date: v.start_date || null,
  due_date: v.due_date || null,
  description: v.description || null,
});

export function AddMilestone({ teamId, nextPosition }: { teamId: string; nextPosition: number }) {
  const router = useRouter();
  const empty = { name: "", start_date: "", due_date: "", description: "" };
  const [value, setValue] = useState<Fields>(empty);
  const [message, setMessage] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("milestones").insert({ ...toRow(value), team_id: teamId, position: nextPosition });
    if (error) {
      setMessage(`足せませんでした：${error.message}`);
      return;
    }
    setValue(empty);
    setMessage("");
    router.refresh();
  };

  return (
    <form onSubmit={add} className="space-y-2">
      <MilestoneFields value={value} onChange={setValue} />
      <button className="rounded bg-gray-900 px-3 py-1 text-sm text-white hover:bg-gray-700">足す</button>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </form>
  );
}

// 段階のカードの下に出る「直す・↑↓・消す」
export function EditMilestone({ milestone, prev, next }: { milestone: Milestone; prev?: Milestone; next?: Milestone }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Fields>({
    name: milestone.name,
    start_date: milestone.start_date ?? "",
    due_date: milestone.due_date ?? "",
    description: milestone.description ?? "",
  });
  const [message, setMessage] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("milestones").update(toRow(value)).eq("id", milestone.id);
    if (error) {
      setMessage(`保存できませんでした：${error.message}`);
      return;
    }
    setOpen(false);
    router.refresh();
  };

  // 隣の段階と position を入れ替える
  const swap = async (other?: Milestone) => {
    if (!other) return;
    await supabase.from("milestones").update({ position: other.position }).eq("id", milestone.id);
    await supabase.from("milestones").update({ position: milestone.position }).eq("id", other.id);
    router.refresh();
  };

  const remove = async () => {
    if (!confirm(`段階「${milestone.name}」を消しますか？（中のタスクは「段階なし」になります）`)) return;
    await supabase.from("milestones").delete().eq("id", milestone.id);
    router.refresh();
  };

  if (open) {
    return (
      <form onSubmit={save} className="mt-3 space-y-2 border-t pt-2">
        <MilestoneFields value={value} onChange={setValue} />
        <div className="flex gap-2 text-sm">
          <button className="rounded bg-gray-900 px-3 py-1 text-white hover:bg-gray-700">保存</button>
          <button type="button" onClick={() => setOpen(false)} className="rounded border px-3 py-1">やめる</button>
          <button type="button" onClick={remove} className="ml-auto px-2 text-red-600">消す</button>
        </div>
        {message && <p className="text-sm text-red-600">{message}</p>}
      </form>
    );
  }

  return (
    <div className="mt-3 flex gap-2 border-t pt-2 text-xs text-gray-500">
      <button onClick={() => setOpen(true)} className="hover:underline">直す</button>
      <button onClick={() => swap(prev)} disabled={!prev} className="ml-auto disabled:opacity-30" aria-label="前へ">←前へ</button>
      <button onClick={() => swap(next)} disabled={!next} className="disabled:opacity-30" aria-label="後ろへ">後ろへ→</button>
    </div>
  );
}
