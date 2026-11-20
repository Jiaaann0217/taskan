// Taskan で使うデータの型（TypeScript）
//
// 本当の定義は Supabase のテーブル（supabase/002_stage1_tables.sql）。
// ここはその「写し」。表を変えたら、ここも手で直す。
//
// SQL と TypeScript の対応
//   text / uuid / date / timestamptz …… string（日付も文字列で届く）
//   int                              …… number
//   text[]                           …… string[]
//   not null が付いている列          …… そのまま（例：string）
//   not null が付いていない列        …… 「| null」を付ける（例：string | null）

// ── お手本（AI が書いた）────────────────────────
// SQL（002 の ②）:
//   team_id      uuid not null
//   user_id      uuid not null
//   display_name text not null
//   role         text not null  check (role in ('owner', 'member', 'assistant'))
//   joined_at    timestamptz not null
export type TeamMember = {
  team_id: string;
  user_id: string;
  display_name: string;
  role: "owner" | "member" | "assistant"; // 3つのどれかしか入らない
  joined_at: string;
};

// SQL（002 の ①）:
//   id          uuid primary key            ← primary key は自動で not null
//   name        text not null
//   invite_code text not null
//   statuses    text[] not null
//   goal        text
//   goal_date   date
//   archived_at timestamptz
//   created_at  timestamptz not null
export type Team = {
  id : string;
  name : string;
  invite_code : string;
  statuses : string[];
  goal : string | null;
  goal_date : string | null;
  archived_at : string | null;
  created_at : string;
  repo_url : string | null; // AI が追記：チームの GitHub（supabase/007）
};

// ── ここから AI が書いた ───────────────────────────
// SQL（002 の ③）:
//   id uuid primary key / team_id uuid not null / name text not null
//   position int not null / created_at timestamptz not null
export type Milestone = {
  id: string;
  team_id: string;
  name: string;
  position: number;
  created_at: string;
  // ここから supabase/007 で足した（ロードマップ用）
  start_date: string | null;
  due_date: string | null;
  description: string | null; // この段階で何を作るか
};

// tasks は昔 Supabase の画面で作った表に、002 の ④ で列を足したもの。
// Taskan で使う列だけを書く（progress・assignee_id など学園祭の列は使わない）
export type Task = {
  id: string;
  team_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  done_criteria: string | null; // 完了の条件
  status: string | null;
  assignee_user_id: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string; // 最後に変わった時刻（supabase/006 で足した）
};

// 質問箱（supabase/007）
export type QuestionStatus = "open" | "answered" | "resolved"; // 未回答・回答あり・解決

export type Question = {
  id: string;
  team_id: string;
  body: string;
  asked_by: string;
  status: QuestionStatus;
  created_at: string;
  resolved_at: string | null;
};

export type Answer = {
  id: string;
  question_id: string;
  team_id: string;
  body: string;
  answered_by: string;
  sources: string | null;            // AI が参照した資料と日付
  corrects_answer_id: string | null; // 訂正なら、どの答えを直したか
  created_at: string;
};
