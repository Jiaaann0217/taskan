"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Team, TeamMember } from "@/lib/types";

// 招待コードと招待リンク。押すとコピーできる
export function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState<"" | "code" | "link">("");
  const copy = async (what: "code" | "link") => {
    const text = what === "code" ? code : `${window.location.origin}/join?code=${code}`;
    await navigator.clipboard.writeText(text);
    setCopied(what);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => copy("link")} className="rounded bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-700">
        {copied === "link" ? "招待リンクをコピーしました" : "招待リンクをコピー"}
      </button>
      <button onClick={() => copy("code")} className="rounded border bg-white px-3 py-2 font-mono text-lg hover:bg-gray-50">
        {code} <span className="text-xs text-gray-600">{copied === "code" ? "コピーしました" : "コピー"}</span>
      </button>
    </div>
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

// チーム名・ゴール・GitHub（owner だけ）
export function TeamEditor({ team }: { team: Team }) {
  const router = useRouter();
  const [name, setName] = useState(team.name);
  const [goal, setGoal] = useState(team.goal ?? "");
  const [goalDate, setGoalDate] = useState(team.goal_date ?? "");
  const [repoUrl, setRepoUrl] = useState(team.repo_url ?? "");
  const [message, setMessage] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("teams")
      .update({ name, goal: goal || null, goal_date: goalDate || null, repo_url: repoUrl || null })
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
      <button className="rounded bg-gray-900 px-3 py-1 text-white hover:bg-gray-700">保存</button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
  );
}

// ステータスの種類（owner だけ）
// 1行ずつ「もとの名前」を覚えておき、名前を変えた行は、今あるタスクも新しい名前に置き換える（supabase/008）
type StatusRow = { from: string | null; name: string }; // from が null の行は、新しく足したもの

export function StatusEditor({ team }: { team: Team }) {
  const router = useRouter();
  const [rows, setRows] = useState<StatusRow[]>(team.statuses.map((s) => ({ from: s, name: s })));
  const [message, setMessage] = useState("");

  const setName = (i: number, name: string) => setRows(rows.map((r, j) => (j === i ? { ...r, name } : r)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...rows];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setRows(next);
  };

  const save = async () => {
    const cleaned = rows.map((r) => ({ ...r, name: r.name.trim() })).filter((r) => r.name !== "");
    const names = cleaned.map((r) => r.name);
    if (names.length < 2) return setMessage("ステータスは2つ以上にしてください");
    if (new Set(names).size !== names.length) return setMessage("同じ名前が2つあります");

    const renames = cleaned.filter((r) => r.from && r.from !== r.name).map((r) => ({ from: r.from, to: r.name }));
    const { error } = await supabase.rpc("update_team_statuses", {
      target_team_id: team.id,
      new_statuses: names,
      renames,
    });
    if (error) setMessage(`保存できませんでした：${error.message}`);
    else setMessage(renames.length ? `保存しました（${renames.length}件の名前を、タスクにも反映）` : "保存しました");
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
        上から順に進み、一番下が「完了」です。下から2番目は「確認待ち（レビュー）」として、ダッシュボードで数えます。
      </p>
      <ol className="space-y-1">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-5 text-right text-sm text-gray-500">{i + 1}</span>
            <input value={r.name} onChange={(e) => setName(i, e.target.value)} className="flex-1 rounded border px-2 py-1" />
            {r.from && r.from !== r.name.trim() && <span className="text-xs text-blue-700">もと：{r.from}</span>}
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1 disabled:opacity-30" aria-label="上へ">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="px-1 disabled:opacity-30" aria-label="下へ">↓</button>
            <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="px-1 text-red-600">消す</button>
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRows([...rows.slice(0, -1), { from: null, name: "" }, ...rows.slice(-1)])}
          className="rounded border px-3 py-1 text-sm"
        >
          ＋ 完了の前に足す
        </button>
        <button type="button" onClick={save} className="rounded bg-gray-900 px-3 py-1 text-sm text-white hover:bg-gray-700">
          保存
        </button>
      </div>
      <p className="text-xs text-gray-500">名前を変えると、そのステータスのタスクも新しい名前になります。タスクが残っているステータスは消せません。</p>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}

// メンバーが受け持つ役割（例：フロントA）を選ぶ（supabase/009）
// 自分の分は自分で、ほかの人の分は owner が関数 set_member_team_role で変える
export function TeamRoleSelect({
  teamId,
  userId,
  value,
  roles,
  isSelf,
}: {
  teamId: string;
  userId: string;
  value: string | null;
  roles: string[];
  isSelf: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  const change = async (newRole: string) => {
    const { error } = isSelf
      ? await supabase.from("team_members").update({ team_role: newRole || null }).eq("team_id", teamId).eq("user_id", userId)
      : await supabase.rpc("set_member_team_role", { target_team_id: teamId, target_user_id: userId, new_team_role: newRole });
    setMessage(error ? error.message : "");
    router.refresh();
  };

  return (
    <>
      <select value={value ?? ""} onChange={(e) => change(e.target.value)} className="rounded border px-1 py-0.5">
        <option value="">役割なし</option>
        {roles.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
        {value && !roles.includes(value) && <option value={value}>{value}（一覧にない）</option>}
      </select>
      {message && <span className="ml-2 text-red-600">{message}</span>}
    </>
  );
}

// チームの役割の一覧（owner だけ）。タスクの担当を、人の代わりに役割で付けられる
export function RolesEditor({ team }: { team: Team }) {
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>(team.roles);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const save = async (next: string[]) => {
    const { error } = await supabase.from("teams").update({ roles: next }).eq("id", team.id);
    if (error) {
      setMessage(`保存できませんでした：${error.message}`);
      return;
    }
    setRoles(next);
    setMessage("");
    router.refresh();
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n || roles.includes(n)) return;
    setName("");
    save([...roles, n]);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {roles.length === 0 && <span className="text-sm text-gray-500">まだありません</span>}
        {roles.map((r) => (
          <span key={r} className="flex items-center gap-1 rounded border bg-white px-2 py-0.5 text-sm">
            {r}
            <button onClick={() => save(roles.filter((x) => x !== r))} className="text-red-600" aria-label={`${r}を消す`}>
              ×
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={add} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="役割の名前（例：フロントA）"
          className="flex-1 rounded border px-3 py-1"
        />
        <button className="rounded bg-gray-900 px-3 py-1 text-sm text-white hover:bg-gray-700">足す</button>
      </form>
      <p className="text-xs text-gray-500">役割を消しても、その役割で担当を付けたタスクはそのまま残ります。</p>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </div>
  );
}
