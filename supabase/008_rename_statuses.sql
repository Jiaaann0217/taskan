-- ステータスの種類を変える（owner だけ）
-- 名前を変えたステータスは、今あるタスクも新しい名前に置き換える。
-- チームの表とタスクの表を1回でまとめて変えるので、途中で失敗したら全部取り消される。
--
-- new_statuses：新しいステータスの並び（左から順に進み、一番右が「完了」）
-- renames     ：名前を変えたもの。例 [{"from": "確認待ち", "to": "PR 確認中"}]
create or replace function public.update_team_statuses(target_team_id uuid, new_statuses text[], renames jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r jsonb;
  leftover record;
begin
  if not public.is_team_owner(target_team_id) then
    raise exception 'チームを作った人だけが変えられます';
  end if;
  if coalesce(array_length(new_statuses, 1), 0) < 2 then
    raise exception 'ステータスは2つ以上にしてください';
  end if;

  -- ① 名前を変えたものを、タスクにも反映する
  for r in select * from jsonb_array_elements(coalesce(renames, '[]'::jsonb))
  loop
    update public.tasks
    set status = r->>'to'
    where team_id = target_team_id and status = r->>'from';
  end loop;

  -- ② 消したステータスのタスクが残っていたら、止める（全部取り消される）
  select status, count(*) as n into leftover
  from public.tasks
  where team_id = target_team_id and status is not null and not (status = any(new_statuses))
  group by status
  limit 1;
  if found then
    raise exception '「%」のタスクが % 件あります。先にタスクを別のステータスに移してください', leftover.status, leftover.n;
  end if;

  -- ③ チームのステータスを新しい並びにする
  update public.teams set statuses = new_statuses where id = target_team_id;
end;
$$;

revoke execute on function public.update_team_statuses(uuid, text[], jsonb) from public, anon;
grant  execute on function public.update_team_statuses(uuid, text[], jsonb) to authenticated;
