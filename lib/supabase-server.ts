import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// サーバーコンポーネント用。リクエストの Cookie からログイン中のユーザーを読む
export async function createSupabaseServerClient() {
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
}
