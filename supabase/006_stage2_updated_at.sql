-- 段階2：タスクが最後に変わった時刻 updated_at を足す
-- 「何日も動きがない」タスクを見つけるのに使う

-- ① 列を足す。今あるタスクには、作った時刻を入れておく
alter table public.tasks
  add column updated_at timestamptz not null default now();

update public.tasks set updated_at = coalesce(created_at, now());   -- coalesce：空なら右の値

-- ② タスクが変わるたびに、updated_at を今の時刻にする関数
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();   -- new は「これから保存される行」
  return new;
end;
$$;

-- ③ トリガー：tasks の行が update される直前に、② を自動で呼ぶ
create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute function public.touch_updated_at();
