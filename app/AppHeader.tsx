import Link from "next/link";
import { getMyClaims } from "@/lib/supabase-server";
import LogoutButton from "./LogoutButton";

// どの画面でも上に出す帯。左にアプリ名（トップへ戻る）、右にメールとログアウト
export default async function AppHeader({ children }: { children?: React.ReactNode }) {
  const { email } = await getMyClaims();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-2xl font-bold">
          Taskan
        </Link>
        {children}
      </div>
      <div className="flex items-center gap-3 text-sm">
        {email && <span className="text-gray-600">{email}</span>}
        <LogoutButton />
      </div>
    </header>
  );
}
