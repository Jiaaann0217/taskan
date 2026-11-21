// GitHub の PR の状態を読む（サーバー側だけで使う。鍵 GITHUB_TOKEN はブラウザに出さない）
//
// 鍵は「読み取り専用」の GitHub トークン（Fine-grained token、Pull requests: Read-only）。
// .env.local と Vercel の環境変数に GITHUB_TOKEN として本人が入れる。
// 鍵がないときは PR を表示しない。GitHub が一時的に読めないときは、状態なし（リンクだけ）で表示する
import type { Task } from "@/lib/types";

export type PrState = "open" | "draft" | "merged" | "closed" | "unknown";

export type PrInfo = {
  url: string; // https://github.com/owner/repo/pull/24
  number: number;
  state: PrState;
  title: string | null;
};

// "https://github.com/o/r/pull/24" → { owner, repo, number }
function parsePrUrl(url: string) {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  return m ? { owner: m[1], repo: m[2], number: Number(m[3]) } : null;
}

// タスクの PR の URL。pr_urls が空なら、タイトルと完了の条件に書いた「PR #24」「#24」を、チームのリポジトリの PR として読む
// （「#20」のように Issue の番号が混ざっていても、GitHub に聞くと PR ではないと分かるので、表示から外れる）
export function prUrlsOf(task: Task, repoUrl: string | null): string[] {
  if (task.pr_urls && task.pr_urls.length > 0) return task.pr_urls;
  if (!repoUrl) return [];
  const base = repoUrl.replace(/\/+$/, "");
  const text = `${task.title} ${task.done_criteria ?? ""}`;
  const numbers = [...text.matchAll(/#(\d+)/g)].map((m) => m[1]);
  return [...new Set(numbers)].map((n) => `${base}/pull/${n}`);
}

// PR 1本の状態を GitHub に聞く。1分間は同じ答えを使い回す（GitHub への問い合わせを減らす）
async function fetchPr(url: string): Promise<PrInfo | null> {
  const p = parsePrUrl(url);
  if (!p) return null;
  const token = process.env.GITHUB_TOKEN;
  // 鍵がないと、PR か Issue かも分からないので、何も出さない（画面に「鍵がない」と出す）
  if (!token) return null;

  try {
    const res = await fetch(`https://api.github.com/repos/${p.owner}/${p.repo}/pulls/${p.number}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null; // PR ではない（Issue の番号など）か、見えないリポジトリ
    if (!res.ok) return { url, number: p.number, state: "unknown", title: null };
    const pr = await res.json();
    const state: PrState = pr.merged_at ? "merged" : pr.state === "closed" ? "closed" : pr.draft ? "draft" : "open";
    return { url, number: p.number, state, title: pr.title ?? null };
  } catch {
    return { url, number: p.number, state: "unknown", title: null };
  }
}

// タスクごとの PR の状態。{ タスクの id: PrInfo[] }
export async function loadPrs(tasks: Task[], repoUrl: string | null): Promise<Record<string, PrInfo[]>> {
  const urlsByTask = tasks.map((t) => [t.id, prUrlsOf(t, repoUrl)] as const);
  const allUrls = [...new Set(urlsByTask.flatMap(([, urls]) => urls))];
  const infos = await Promise.all(allUrls.map(fetchPr));
  const byUrl = new Map(allUrls.map((u, i) => [u, infos[i]]));
  return Object.fromEntries(
    urlsByTask.map(([id, urls]) => [id, urls.map((u) => byUrl.get(u)).filter((x): x is PrInfo => !!x)])
  );
}

// 「完了にしてよい」：PR が1本以上あり、全部がマージ済みか閉じていて、1本はマージ済み
export function readyToClose(prs: PrInfo[]): boolean {
  return prs.length > 0 && prs.some((p) => p.state === "merged") && prs.every((p) => p.state === "merged" || p.state === "closed");
}

// GitHub の鍵が設定されているか（画面に「鍵がないので状態は出せません」と出すため）
export function hasGithubToken(): boolean {
  return !!process.env.GITHUB_TOKEN;
}
