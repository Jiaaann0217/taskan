-- 段階1-②：学園祭のデータをアーカイブする（削除はしない）
-- 002 のあとに実行する

-- ① 「学園祭 Web班（アーカイブ）」チームを作り、
--    今ある tasks 19件と users 15人をそのチームに付ける。
--    3つの操作を1つの文で行うので、途中で失敗したら全部取り消される
with archive_team as (
  insert into public.teams (name, archived_at, statuses)
  values (
    '学園祭 Web班（アーカイブ）',
    now(),
    array['未着手', 'Figma制作中', 'Figma確認中', 'Figma完了', '実装中', 'プルリク確認中', '手直し中', '完成']
  )
  returning id
),
moved_tasks as (
  update public.tasks set team_id = (select id from archive_team)
  where team_id is null
  returning 1
)
update public.users set team_id = (select id from archive_team)
where team_id is null;

-- ② これからは、すべてのタスクが必ずどこかのチームに属する
alter table public.tasks alter column team_id set not null;

-- ③ 「ログインしていない人なら誰でも読み書きできる」古いルールを全部消す
--    → 今 Vercel で公開している学園祭版は、何も表示されなくなる（データは残る）
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('tasks', 'users')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

revoke all on public.tasks, public.users from anon;
