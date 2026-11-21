"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

type Tab = { key: string; label: string; href: string };

// スマホのときだけ出るハンバーガーメニュー。押すと、タブ・メールアドレス・ログアウトが縦に並ぶ
export default function MobileMenu({ tabs, current, email }: { tabs: Tab[]; current?: string; email?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded hover:bg-gray-100"
      >
        {/* 3本線。開いているときは × の形にする */}
        <span className={`block h-0.5 w-5 bg-gray-800 transition ${open ? "translate-y-2 rotate-45" : ""}`} />
        <span className={`block h-0.5 w-5 bg-gray-800 transition ${open ? "opacity-0" : ""}`} />
        <span className={`block h-0.5 w-5 bg-gray-800 transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b bg-white shadow-lg">
          {tabs.length > 0 && (
            <nav className="flex flex-col py-1">
              {tabs.map((t) => (
                <Link
                  key={t.key}
                  href={t.href}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 ${t.key === current ? "bg-gray-100 font-bold" : "text-gray-700"}`}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm">
            <span className="truncate text-gray-600">{email}</span>
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
