"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// 招待コードで参加するフォーム（ブラウザで動く）
export default function JoinTeamForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [myName, setMyName] = useState("");
  const [message, setMessage] = useState("");

  // ★本人が書く：handleJoin
  // 目的：入力された招待コードでチームに参加し、成功したらそのチームのページへ移る
  // お手本：CreateTeamForm.tsx の handleCreate（ほぼ同じ形）
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault(); // フォームを送るとページが読み直されるのを止める

    // TODO ①：データベースの関数 join_team を呼ぶ（supabase/004 の ⑤）
    //   引数の名前は code と my_name。値は、上の useState で持っている code と myName
    const { data , error } = await supabase.rpc("join_team", {
      code : code,
      my_name : myName
    });

    // TODO ②：失敗したら、理由を setMessage で画面に出して終わる（return）
    if(error){
      return(
        setMessage(`参加できませんでした。: ${error.message}`)
      )
    }
    // TODO ③：成功したら、そのチームのページ /t/チームのid へ移る
    router.push(`/t/${data}`);
  };

  return (
    <form onSubmit={handleJoin} className="space-y-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="招待コード（8文字）"
        required
        className="w-full rounded border px-3 py-2 font-mono uppercase"
      />
      <input
        value={myName}
        onChange={(e) => setMyName(e.target.value)}
        placeholder="チームでのあなたの表示名（例：佐藤）"
        required
        className="w-full rounded border px-3 py-2"
      />
      <button className="rounded border border-gray-900 px-4 py-2 hover:bg-gray-100">
        参加
      </button>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </form>
  );
}
