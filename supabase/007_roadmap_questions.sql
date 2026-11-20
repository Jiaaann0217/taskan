-- 段階3・4：ロードマップと質問箱
-- ① 段階に期間と説明を足す（ロードマップの図に使う）
alter table public.milestones
  add column start_date  date,
  add column due_date    date,
  add column description text;   -- この段階で何を作るか

-- ② チームの GitHub リポジトリ（AI が決まりを読みに行く場所）
alter table public.teams
  add column repo_url text;

-- ③ 権限の穴をふさぐ
--    段階1の「自分の行を変えられる」ルールだと、自分の role を owner に書き換えられてしまう。
--    → 自分で変えられる列を display_name だけにする
revoke update on public.team_members from authenticated;
grant  update (display_name) on public.team_members to authenticated;

--    役割（member / assistant）を変えるのは owner だけ。この関数から行う
create or replace function public.set_member_role(target_team_id uuid, target_user_id uuid, new_role text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_team_owner(target_team_id) then
    raise exception 'チームを作った人だけが変えられます';
  end if;
  if new_role not in ('member', 'assistant') then
    raise exception '役割は member か assistant です';
  end if;
  update public.team_members set role = new_role
  where team_id = target_team_id and user_id = target_user_id and role <> 'owner';
end;
$$;
revoke execute on function public.set_member_role(uuid, uuid, text) from public, anon;
grant  execute on function public.set_member_role(uuid, uuid, text) to authenticated;

-- ④ 質問箱
create table public.questions (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  body        text not null,
  asked_by    uuid not null references auth.users(id) on delete cascade,
  -- open：未回答　answered：回答あり　resolved：解決
  status      text not null default 'open' check (status in ('open', 'answered', 'resolved')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.answers (
  id                 uuid primary key default gen_random_uuid(),
  question_id        uuid not null references public.questions(id) on delete cascade,
  team_id            uuid not null references public.teams(id) on delete cascade,
  body               text not null,
  answered_by        uuid not null references auth.users(id) on delete cascade,
  sources            text,   -- AI が参照した資料と日付
  corrects_answer_id uuid references public.answers(id) on delete set null,   -- 訂正なら、どの答えを直したか
  created_at         timestamptz not null default now()
);

alter table public.questions enable row level security;
alter table public.answers   enable row level security;
grant select, insert, update, delete on public.questions, public.answers to authenticated;

-- 質問：メンバー（AI も）は読める。聞けるのは owner と member。
--       解決にする・消すのは、聞いた人か owner
create policy "members read questions" on public.questions
  for select to authenticated using (public.is_team_member(team_id));
create policy "editors ask" on public.questions
  for insert to authenticated
  with check (public.is_team_editor(team_id) and asked_by = (select auth.uid()));
create policy "asker or owner updates question" on public.questions
  for update to authenticated
  using (asked_by = (select auth.uid()) or public.is_team_owner(team_id))
  with check (asked_by = (select auth.uid()) or public.is_team_owner(team_id));
create policy "asker or owner deletes question" on public.questions
  for delete to authenticated
  using (asked_by = (select auth.uid()) or public.is_team_owner(team_id));

-- 答え：メンバー（AI も）は読める・答えられる。消せるのは書いた本人
create policy "members read answers" on public.answers
  for select to authenticated using (public.is_team_member(team_id));
create policy "members answer" on public.answers
  for insert to authenticated
  with check (
    public.is_team_member(team_id)
    and answered_by = (select auth.uid())
    -- 答える質問が、同じチームのものであること
    and exists (select 1 from public.questions q where q.id = question_id and q.team_id = answers.team_id)
  );
create policy "author deletes answer" on public.answers
  for delete to authenticated using (answered_by = (select auth.uid()));

-- 答えが付いたら、未回答の質問を「回答あり」にする（トリガー）
create or replace function public.mark_question_answered()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.questions set status = 'answered'
  where id = new.question_id and status = 'open';
  return new;
end;
$$;

create trigger answers_mark_question_answered
  after insert on public.answers
  for each row execute function public.mark_question_answered();
