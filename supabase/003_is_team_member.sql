-- 段階1-③：門番 is_team_member（★本人が書く）
-- 005 のあとに実行する
--
-- 目的：ログイン中の人が、そのチームのメンバーかどうかを true / false で返す
-- 入力：target_team_id（調べたいチームの id）
-- 出力：boolean（メンバーなら true）
--
-- この関数を、004 のすべてのルール（RLS ポリシー）が使う

create or replace function public.is_team_member(target_team_id uuid)
returns boolean
language sql
stable                  -- 同じ入力なら同じ答え（データを書き換えない）という宣言
security definer        -- 作った人の権限で動く（理由は理解ノートに書く）
set search_path = ''    -- 安全のため、テーブル名は必ず public.〜 と書く
as $$
  -- TODO：ここに SELECT 文を1つ書く
  --   「public.team_members の中に、
  --     team_id が target_team_id で、かつ
  --     user_id が今ログインしている人 の行があるか」を true / false で返す
  --
  -- 使う部品：
  --   今ログインしている人の id …… (select auth.uid())
  --   行があるかどうか …………… exists ( select 1 from ... where ... )
  select exists(
  select 1
  from public.team_members 
  where team_id = target_team_id and user_id = (select auth.uid())
  );
$$;
