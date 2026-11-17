-- ログインした人（authenticated）にテーブルの読み書き権限を付ける
-- 元の設定ではログインなし（anon）にしか権限がなく、ログインすると
-- 「permission denied for table tasks」になっていた（2026-11-16）
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.users to authenticated;
