"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// チームを作るフォーム（ブラウザで動く）
// handleJoin を書くときのお手本にもなる
export default function CreateTeamForm() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [myName, setMyName] = useState("");
  const [message, setMessage] = useState("");

  // 「作る」を押したときに動く関数
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); // フォームを送るとページが読み直されるのを止める

    // ① データベースの関数 create_team を呼ぶ（supabase/004 の ④）
    //    rpc("関数の名前", { 引数の名前: 値 })
    const { data, error } = await supabase.rpc("create_team", {
      team_name: teamName,
      my_name: myName,
    });

    // ② 失敗したら、理由を画面に出して終わる
    if (error) {
      setMessage(`作れませんでした：${error.message}`);
      return;
    }

    // ③ 成功したら、data に新しいチームの id が入っている。そのチームのページへ移る
    router.push(`/t/${data}`);
  };

  return (
    <form onSubmit={handleCreate} className="space-y-2">
      <input
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        placeholder="チーム名（例：サーバー演習チーム）"
        required
        className="w-full rounded border px-3 py-2"
      />
      <input
        value={myName}
        onChange={(e) => setMyName(e.target.value)}
        placeholder="チームでのあなたの表示名（例：佐藤）"
        required
        className="w-full rounded border px-3 py-2"
      />
      <button className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-gray-700">
        作る
      </button>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </form>
  );
}
