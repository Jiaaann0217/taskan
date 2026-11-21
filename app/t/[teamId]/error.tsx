"use client";

// チームの画面で読み込みに失敗したときに出す画面（「見つかりません」とは分ける）
export default function TeamError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto min-h-screen max-w-xl p-8 text-gray-900">
      <h1 className="mb-2 text-lg font-bold">読み込めませんでした</h1>
      <p className="mb-4 text-sm text-gray-600">
        通信やログインの一時的な問題かもしれません。もう一度読み込んでください。
      </p>
      <button
        type="button"
        onClick={() => {
          reset();
          window.location.reload();
        }}
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
      >
        もう一度読み込む
      </button>
    </main>
  );
}
