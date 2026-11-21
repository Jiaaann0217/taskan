import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// データの読み出し（GET）が 401 なら、1秒待って1回だけやり直す fetch
// 理由：ログインの期限が切れたあとの最初の表示では、proxy.ts がトークンを更新した直後に読みに行く。
// そのとき、できたてのトークンがデータベース側で一瞬だけ拒否される（401）ことがあった（2026-11-21、Supabase のログで確認）。
// やり直さないと teams が空になり、メンバーなのに「見つかりません（404）」になる
async function fetchRetryOn401(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  const method = (init?.method ?? "GET").toUpperCase();
  const isRead = method === "GET" || method === "HEAD";
  const url = input instanceof Request ? input.url : String(input);
  if (res.status === 401 && isRead && url.includes("/rest/v1/")) {
    await new Promise((r) => setTimeout(r, 1000));
    return fetch(input, init);
  }
  return res;
}

// サーバーコンポーネント用。リクエストの Cookie からログイン中のユーザーを読む
// cache で包むと、1回のページ表示の中では何度呼んでも1回分しか作らない
export const createSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { fetch: fetchRetryOn401 },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // サーバーコンポーネントからは Cookie を書けない。更新は proxy.ts が行うので無視してよい
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
});

// ログイン中の人の情報（id とメール）。ヘッダーと各画面で使うが、1回のページ表示で1回だけ確かめる
export const getMyClaims = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  return {
    id: data?.claims?.sub as string | undefined,
    email: data?.claims?.email as string | undefined,
  };
});
