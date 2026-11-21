// チームの中でページを移るあいだ、すぐに出す仮の画面（データが届いたら本物に入れ替わる）
export default function Loading() {
  return (
    <main className="min-h-screen w-full px-4 py-4 md:px-8 md:py-6" aria-busy="true">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-gray-200" />
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
      <div className="mb-6 h-40 animate-pulse rounded bg-gray-200" />
      <p className="text-sm text-gray-500">読み込み中…</p>
    </main>
  );
}
