"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Milestone, TeamMember } from "@/lib/types";

type Props = {
  teamId: string;
  statuses: string[];
  milestones: Milestone[];
  members: TeamMember[];
  roles: string[];
};

// 1行を読み取った結果
type Row = {
  line: number;
  title: string;
  done_criteria: string | null;
  milestone_id: string | null;
  milestoneName: string;
  assignee_user_id: string | null;
  assignee_role: string | null;
  assigneeName: string;
  deadline: string | null;
  problems: string[]; // 足せない理由（あれば、その行は足さない）
};

const EXAMPLE = `# 認証
ログイン画面 | 登録 → ログイン → ホームに移れる | フロントA | 2026-11-30
ログイン API | POST /login が JWT を返す | バックA | 2026-11-28
# 旅行計画
旅行の一覧画面 | 自分の旅行が新しい順に並ぶ | フロントB`;

// テキストを1行ずつ読み、タスクの形にする
// 書き方：「# 段階の名前」の行で段階を切り替え、タスクは「タイトル | 完了の条件 | 担当 | 締め切り」（2つ目以降は省略できる）
function parse(text: string, milestones: Milestone[], members: TeamMember[], roles: string[]): Row[] {
  const rows: Row[] = [];
  let current: Milestone | null = null;
  let currentName = "段階なし";
  let currentMissing = false;

  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;

    if (line.startsWith("#")) {
      const name = line.replace(/^#+/, "").trim();
      current = milestones.find((m) => m.name === name) ?? null;
      currentName = name || "段階なし";
      currentMissing = !!name && !current;
      return;
    }

    const [title = "", criteria = "", who = "", date = ""] = line.split("|").map((s) => s.trim());
    const problems: string[] = [];
    if (!title) problems.push("タイトルがない");
    if (currentMissing) problems.push(`段階「${currentName}」がない（ロードマップで先に作る）`);

    // 担当：役割の名前 → メンバーの表示名 の順に探す
    let assignee_user_id: string | null = null;
    let assignee_role: string | null = null;
    if (who) {
      if (roles.includes(who)) assignee_role = who;
      else {
        const m = members.find((x) => x.display_name === who && x.role !== "assistant");
        if (m) assignee_user_id = m.user_id;
        else problems.push(`担当「${who}」が役割にもメンバーにもない`);
      }
    }

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) problems.push(`締め切り「${date}」は 2026-11-30 の形で書く`);

    rows.push({
      line: i + 1,
      title,
      done_criteria: criteria || null,
      milestone_id: (current as Milestone | null)?.id ?? null,
      milestoneName: currentName,
      assignee_user_id,
      assignee_role,
      assigneeName: who || "担当なし",
      deadline: date || null,
      problems,
    });
  });
  return rows;
}

// タスクをまとめて足す（PM が SQL を書かずに、ロードマップのタスクを一気に入れるため）
export default function BulkAdd({ teamId, statuses, milestones, members, roles }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => parse(text, milestones, members, roles), [text, milestones, members, roles]);
  const ok = rows.filter((r) => r.problems.length === 0);
  const ng = rows.filter((r) => r.problems.length > 0);

  const add = async () => {
    if (ok.length === 0 || ng.length > 0) return;
    setSaving(true);
    const { error } = await supabase.from("tasks").insert(
      ok.map((r) => ({
        team_id: teamId,
        title: r.title,
        done_criteria: r.done_criteria,
        milestone_id: r.milestone_id,
        assignee_user_id: r.assignee_user_id,
        assignee_role: r.assignee_role,
        deadline: r.deadline,
        status: statuses[0],
      }))
    );
    setSaving(false);
    if (error) {
      setMessage(`足せませんでした：${error.message}`);
      return;
    }
    setMessage(`${ok.length}件を足しました`);
    setText("");
    router.refresh();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded border bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
        まとめて足す（1行1タスク）
      </button>
    );
  }

  return (
    <section className="space-y-3 rounded border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">まとめて足す</h2>
        <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:underline">閉じる</button>
      </div>
      <div className="text-xs text-gray-600">
        <p>1行に1タスク：<code>タイトル | 完了の条件 | 担当 | 締め切り</code>（完了の条件から後ろは省略できる）</p>
        <p>
          「<code># 段階の名前</code>」の行の下は、その段階に入る。担当は役割（{roles.length ? roles.join("・") : "設定で作る"}）かメンバーの表示名。
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={EXAMPLE}
        rows={8}
        className="w-full rounded border px-3 py-2 font-mono text-sm"
      />
      <button type="button" onClick={() => setText(EXAMPLE)} className="text-xs text-blue-700 hover:underline">
        例を入れてみる
      </button>

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-500">
              <tr>
                <th className="py-1 pr-2">行</th>
                <th className="pr-2">段階</th>
                <th className="pr-2">タイトル</th>
                <th className="pr-2">完了の条件</th>
                <th className="pr-2">担当</th>
                <th className="pr-2">締め切り</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.line} className={`border-t ${r.problems.length ? "bg-red-50" : ""}`}>
                  <td className="py-1 pr-2 text-gray-500">{r.line}</td>
                  <td className="pr-2">{r.milestoneName}</td>
                  <td className="pr-2">
                    {r.title}
                    {r.problems.map((p) => (
                      <div key={p} className="text-red-600">{p}</div>
                    ))}
                  </td>
                  <td className="pr-2 text-gray-600">{r.done_criteria}</td>
                  <td className="pr-2">{r.assigneeName}</td>
                  <td className="pr-2">{r.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={add}
          disabled={saving || ok.length === 0 || ng.length > 0}
          className="rounded bg-gray-900 px-4 py-1.5 text-sm text-white hover:bg-gray-700 disabled:opacity-40"
        >
          {saving ? "足しています…" : `${ok.length}件を足す`}
        </button>
        {ng.length > 0 && <span className="text-sm text-red-600">赤い行（{ng.length}件）を直すと足せます</span>}
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    </section>
  );
}
