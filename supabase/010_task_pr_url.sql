-- タスクに GitHub の PR を付ける（1つのタスクに複数付けられる）
-- 画面を開いたときに GitHub に問い合わせて、PR の状態（レビュー待ち・マージ済み・閉じた）を表示する
-- 例：{https://github.com/Jiaaann0217/tripper/pull/24}
-- 空のときは、タイトルと完了の条件に書いた「PR #24」をチームの GitHub リポジトリの PR として読む（画面側で）
alter table public.tasks
  add column pr_urls text[] not null default '{}';
