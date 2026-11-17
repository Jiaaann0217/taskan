import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// ブラウザ（クライアントコンポーネント）用。ログイン状態は Cookie に保存され、サーバー側からも読める
export const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);
