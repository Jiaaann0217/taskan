import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// サーバーコンポーネント用。リクエストの Cookie からログイン中のユーザーを読む
// cache で包むと、1回のページ表示の中では何度呼んでも1回分しか作らない
export const createSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
