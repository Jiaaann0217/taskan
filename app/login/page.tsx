"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Supabase のエラーを、何をすればよいか分かる日本語にする
function toJapanese(message: string) {
  if (/fetch|network/i.test(message)) {
    return "サーバーにつながりません。Supabase のプロジェクトが一時停止していないか確かめてください。";
  }
  if (/invalid login credentials/i.test(message)) {
    return "メールアドレスかパスワードが違います。";
  }
  if (/email not confirmed/i.test(message)) {
    return "メールアドレスの確認が済んでいません。届いた確認メールのリンクを開いてください。";
  }
  if (/already registered/i.test(message)) {
    return "このメールアドレスは登録済みです。ログインしてください。";
  }
  if (/rate limit/i.test(message)) {
    return "短い時間に何度も試したため、しばらく待つ必要があります（確認メールの送信回数の上限）。";
  }
  if (/signups? not allowed|disabled/i.test(message)) {
    return "新規登録が無効になっています。Supabase の Authentication 設定を確かめてください。";
  }
  return `うまくいきませんでした：${message}`;
}

export default function LoginPage() {
  const router = useRouter();
  // ログイン後の行き先。招待リンクなどから来たときは ?next= のページへ戻す（このサイトの中だけ）
  const goHome = () => {
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  };
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setMessage(toJapanese(error.message));
        return;
      }
      goHome();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setMessage(toJapanese(error.message));
        return;
      }
      if (data.session) {
        goHome();
      } else {
        setMessage("確認メールを送りました。メールのリンクを開いてから、ログインしてください。");
        setMode("login");
      }
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-300 p-4 text-gray-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "ログイン" : "新規登録"}
        </h1>

        <label className="block">
          <span className="text-sm">メールアドレス</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm">パスワード（6文字以上）</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        {message && <p className="text-sm text-red-700">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 font-bold text-white disabled:opacity-50"
        >
          {loading ? "処理中…" : mode === "login" ? "ログイン" : "登録する"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
          className="w-full text-sm text-blue-700 underline"
        >
          {mode === "login" ? "はじめての方は新規登録" : "登録済みの方はログイン"}
        </button>
      </form>
    </main>
  );
}
