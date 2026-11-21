import type { PrInfo } from "@/lib/github";

const label: Record<PrInfo["state"], string> = {
  open: "レビュー待ち",
  draft: "下書き",
  merged: "マージ済み",
  closed: "閉じた",
  unknown: "",
};
const style: Record<PrInfo["state"], string> = {
  open: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-700",
  merged: "bg-purple-100 text-purple-800",
  closed: "bg-red-100 text-red-700",
  unknown: "bg-gray-100 text-gray-700",
};

// PR の小さな札。押すと GitHub の PR が開く
export default function PrBadges({ prs }: { prs: PrInfo[] }) {
  if (prs.length === 0) return null;
  return (
    <>
      {prs.map((p) => (
        <a
          key={p.url}
          href={p.url}
          target="_blank"
          rel="noreferrer"
          title={p.title ?? undefined}
          className={`rounded px-1.5 py-0.5 hover:underline ${style[p.state]}`}
        >
          PR #{p.number}
          {label[p.state] && ` ${label[p.state]}`}
        </a>
      ))}
    </>
  );
}
