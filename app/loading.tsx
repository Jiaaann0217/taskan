// トップでページを移るあいだ、すぐに出す仮の画面
export default function Loading() {
  return (
    <main className="min-h-screen w-full px-4 py-4 md:px-8 md:py-6" aria-busy="true">
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mb-3 h-12 animate-pulse rounded bg-gray-200" />
      <div className="h-12 animate-pulse rounded bg-gray-200" />
      <p className="mt-4 text-sm text-gray-500">読み込み中…</p>
    </main>
  );
}
