import Link from "next/link";

type Props = {
  teamId: string;
  teamName: string;
  current: "dashboard" | "tasks" | "settings";
};

// チームの中の切り替え：ダッシュボード・タスク一覧・設定
export default function TeamNav({ teamId, teamName, current }: Props) {
  const tabs = [
    { key: "dashboard", label: "ダッシュボード", href: `/t/${teamId}` },
    { key: "tasks", label: "タスク一覧", href: `/t/${teamId}/tasks` },
    { key: "settings", label: "設定", href: `/t/${teamId}/settings` },
  ];

  return (
    <>
      <span className="text-gray-400">/</span>
      <span className="font-bold">{teamName}</span>
      <nav className="flex gap-1 text-sm">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`rounded px-2 py-1 ${
              t.key === current ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
