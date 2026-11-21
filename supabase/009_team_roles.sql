-- 役割で担当を付ける（例：フロントA、バックA、PM）
-- メンバーが参加する前でも、タスクの担当を役割で決めておける。
-- 参加したメンバーに役割を割り当てると、その役割のタスクはその人の担当として数えられる

-- ① チームの役割の一覧
alter table public.teams
  add column roles text[] not null default '{}';

-- ② メンバーが受け持つ役割（1人1つ）
alter table public.team_members
  add column team_role text;

-- ③ タスクの担当の役割（担当の人 assignee_user_id が空のときに使う）
alter table public.tasks
  add column assignee_role text;

-- ④ 自分の役割は自分で選べる（自分で変えられる列に team_role を足す）
grant update (display_name, team_role) on public.team_members to authenticated;

-- ⑤ ほかの人の役割を割り当てるのは owner だけ
create or replace function public.set_member_team_role(target_team_id uuid, target_user_id uuid, new_team_role text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_team_owner(target_team_id) then
    raise exception 'チームを作った人だけが割り当てられます';
  end if;
  update public.team_members set team_role = nullif(new_team_role, '')
  where team_id = target_team_id and user_id = target_user_id;
end;
$$;
revoke execute on function public.set_member_team_role(uuid, uuid, text) from public, anon;
grant  execute on function public.set_member_team_role(uuid, uuid, text) to authenticated;
