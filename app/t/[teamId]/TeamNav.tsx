import Link from "next/link";

export type TeamTab = "dashboard" | "roadmap" | "tasks" | "questions" | "settings";

// チームの中のタブの一覧（PC のタブと、スマホのメニューで共通）
export function teamTabs(teamId: string): { key: TeamTab; label: string; href: string }[] {
  return [
    { key: "dashboard", label: "ダッシュボード", href: `/t/${teamId}` },
    { key: "roadmap", label: "ロードマップ", href: `/t/${teamId}/roadmap` },
    { key: "tasks", label: "タスク一覧", href: `/t/${teamId}/tasks` },
    { key: "questions", label: "質問箱", href: `/t/${teamId}/questions` },
    { key: "settings", label: "設定", href: `/t/${teamId}/settings` },
  ];
}

// PC で出すタブ（ヘッダーの2行目）。スマホではハンバーガーメニューの中に出すので隠す
export default function TeamNav({ teamId, current }: { teamId: string; current: TeamTab }) {
  return (
    <nav className="hidden gap-1 px-8 text-sm md:flex">
      {teamTabs(teamId).map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`border-b-2 px-3 py-2 whitespace-nowrap ${
            t.key === current ? "border-gray-900 font-bold text-gray-900" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
