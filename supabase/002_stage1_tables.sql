-- 段階1-①：チームの仕組みのテーブルを作る
-- 実行する順番：002 → 005 → 003 → 004

-- ① チーム
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- 招待コード：ランダムな8文字。同じコードは2つできない（unique）
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  -- ステータスの種類。左から順に進み、一番右が「完了」
  statuses    text[] not null default array['未着手', '作業中', '確認待ち', '完了'],
  goal        text,          -- ゴール（例：12/31 までに必須機能を完成）
  goal_date   date,          -- ゴールの日
  archived_at timestamptz,   -- 入っていればアーカイブ済み（一覧に出さない）
  created_at  timestamptz not null default now()
);

-- ② 誰がどのチームにいるか
create table public.team_members (
  team_id      uuid not null references public.teams(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,  -- ログインした人
  display_name text not null,
  -- owner：チームを作った人／member：メンバー／assistant：AI（読むのと質問箱だけ）
  role         text not null default 'member' check (role in ('owner', 'member', 'assistant')),
  joined_at    timestamptz not null default now(),
  primary key (team_id, user_id)   -- 同じ人が同じチームに2回入れない
);

-- ③ 段階（マイルストーン）
create table public.milestones (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  name       text not null,
  position   int  not null default 0,   -- 並び順（小さいほど先）
  created_at timestamptz not null default now()
);

-- ④ 今の tasks に列を足す（今ある列は消さない）
alter table public.tasks
  add column team_id          uuid references public.teams(id) on delete cascade,
  add column milestone_id     uuid references public.milestones(id) on delete set null,
  add column done_criteria    text,   -- 完了の条件
  add column assignee_user_id uuid references auth.users(id) on delete set null;

-- ⑤ 学園祭の担当者表にもチームを付けられるようにする（アーカイブ用）
alter table public.users
  add column team_id uuid references public.teams(id) on delete cascade;

-- ⑥ 新しいテーブルは「ルールがない限り誰も読めない」状態にしておく
--    （読めるようにするルールは 004 で足す）
alter table public.teams        enable row level security;
alter table public.team_members enable row level security;
alter table public.milestones   enable row level security;

grant select, insert, update, delete on public.teams, public.team_members, public.milestones to authenticated;
