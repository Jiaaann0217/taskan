import Link from "next/link";

export type TeamTab = "dashboard" | "roadmap" | "tasks" | "questions" | "settings";

// チームの中の切り替え（ヘッダーの2行目）。タブが多くても改行せず、狭い画面では横にスクロールする
export default function TeamNav({ teamId, current }: { teamId: string; current: TeamTab }) {
  const tabs: { key: TeamTab; label: string; href: string }[] = [
    { key: "dashboard", label: "ダッシュボード", href: `/t/${teamId}` },
    { key: "roadmap", label: "ロードマップ", href: `/t/${teamId}/roadmap` },
    { key: "tasks", label: "タスク一覧", href: `/t/${teamId}/tasks` },
    { key: "questions", label: "質問箱", href: `/t/${teamId}/questions` },
    { key: "settings", label: "設定", href: `/t/${teamId}/settings` },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto px-4 text-sm whitespace-nowrap md:px-8">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`shrink-0 border-b-2 px-3 py-2 ${
            t.key === current ? "border-gray-900 font-bold text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
