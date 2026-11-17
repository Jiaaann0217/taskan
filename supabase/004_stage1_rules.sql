-- 段階1-④：門番を使ったルールと、チームを作る・参加する関数
-- 003（is_team_member）のあとに実行する

-- ① 書き込める人か（owner か member。AI の assistant は読むだけ）
create or replace function public.is_team_editor(target_team_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = target_team_id
      and user_id = (select auth.uid())
      and role in ('owner', 'member')
  );
$$;

-- ② チームの持ち主か
create or replace function public.is_team_owner(target_team_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = target_team_id
      and user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

-- ③ ルール（RLS ポリシー）
--    using       …… どの行を「見られる・変えられる」か
--    with check  …… どんな行を「書き込める」か

-- teams：メンバーは見られる。設定を変えられるのは owner だけ
--        （チームを作るのは ⑤ の create_team 関数から）
create policy "members read team" on public.teams
  for select to authenticated using (public.is_team_member(id));
create policy "owner updates team" on public.teams
  for update to authenticated using (public.is_team_owner(id)) with check (public.is_team_owner(id));

-- team_members：同じチームの人は一覧を見られる。自分の表示名は自分で変えられる。抜けるのは自分か owner
create policy "members read members" on public.team_members
  for select to authenticated using (public.is_team_member(team_id));
create policy "self updates own name" on public.team_members
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "self or owner removes" on public.team_members
  for delete to authenticated using (user_id = (select auth.uid()) or public.is_team_owner(team_id));

-- milestones・tasks：メンバーは見られる。書き込めるのは owner と member
create policy "members read milestones" on public.milestones
  for select to authenticated using (public.is_team_member(team_id));
create policy "editors write milestones" on public.milestones
  for all to authenticated using (public.is_team_editor(team_id)) with check (public.is_team_editor(team_id));

create policy "members read tasks" on public.tasks
  for select to authenticated using (public.is_team_member(team_id));
create policy "editors write tasks" on public.tasks
  for all to authenticated using (public.is_team_editor(team_id)) with check (public.is_team_editor(team_id));

-- users（学園祭の担当者）：ルールを作らない → 誰にも見えない（アーカイブ）

-- ④ チームを作る：チームを作り、作った人を owner として入れる（2つを必ずセットで行う）
create or replace function public.create_team(team_name text, my_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare new_team_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'ログインが必要です';
  end if;

  insert into public.teams (name) values (team_name)
  returning id into new_team_id;

  insert into public.team_members (team_id, user_id, display_name, role)
  values (new_team_id, (select auth.uid()), my_name, 'owner');

  return new_team_id;
end;
$$;

-- ⑤ 招待コードで参加する
--    メンバーでない人はチームを見られない（①〜③のルールのため）。
--    だからこの関数だけは security definer で、コードの照合を特別に行う
create or replace function public.join_team(code text, my_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare found_team_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'ログインが必要です';
  end if;

  select id into found_team_id from public.teams
  where invite_code = upper(trim(code)) and archived_at is null;

  if found_team_id is null then
    raise exception '招待コードが見つかりません';
  end if;

  insert into public.team_members (team_id, user_id, display_name, role)
  values (found_team_id, (select auth.uid()), my_name, 'member')
  on conflict (team_id, user_id) do nothing;   -- すでに入っていれば何もしない

  return found_team_id;
end;
$$;

-- ⑥ 関数を使えるのはログインした人だけ
revoke execute on function public.create_team(text, text), public.join_team(text, text) from public, anon;
grant  execute on function public.create_team(text, text), public.join_team(text, text) to authenticated;
