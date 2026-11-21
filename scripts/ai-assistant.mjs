// Taskan の AI アシスタント用スクリプト（定期実行の Claude Code が使う）
//
// AI 専用アカウント（役割 assistant）としてログインする。
// 門番とルールがそのまま効くので、AI が入っているチームしか見えず、書けるのは質問箱の答えだけ。
//
// 使い方：
//   node scripts/ai-assistant.mjs fetch
//     → AI が入っているチームの、質問・答え（訂正を含む）・ロードマップ・タスクを JSON で出す
//   node scripts/ai-assistant.mjs answer <質問の id> <答えを書いたファイル> [参照した資料]
//     → 答えを書き込む（質問は自動で「回答あり」になる）
//
// .env.local に必要なもの（本人が書く。値は AI に見せない）：
//   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY（今あるもの）
//   TASKAN_AI_EMAIL / TASKAN_AI_PASSWORD（AI 専用アカウント）
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(new URL("../.env.local", import.meta.url));

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, TASKAN_AI_EMAIL: email, TASKAN_AI_PASSWORD: password } =
  process.env;

if (!email || !password) {
  console.error("TASKAN_AI_EMAIL と TASKAN_AI_PASSWORD が .env.local にありません");
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(`AI アカウントでログインできません：${error.message}`);
    process.exit(2);
  }
  return data.user.id;
}

function must(res, what) {
  if (res.error) {
    console.error(`${what}を読めません：${res.error.message}`);
    process.exit(1);
  }
  return res.data ?? [];
}

async function fetchAll() {
  const myId = await login();
  const memberships = must(await supabase.from("team_members").select("team_id, role").eq("user_id", myId), "所属");
  const teamIds = memberships.filter((m) => m.role === "assistant").map((m) => m.team_id);

  const teams = [];
  for (const teamId of teamIds) {
    const [team] = must(await supabase.from("teams").select("*").eq("id", teamId), "チーム");
    if (!team || team.archived_at) continue;
    const members = must(await supabase.from("team_members").select("user_id, display_name, role, team_role").eq("team_id", teamId), "メンバー");
    const nameOf = (id) => members.find((m) => m.user_id === id)?.display_name ?? "（抜けた人）";
    const roleOf = (id) => members.find((m) => m.user_id === id)?.role;
    // 担当：人で付けていればその人、役割で付けていれば「役割（その役割のメンバー）」
    const assigneeOf = (t) => {
      if (t.assignee_user_id) return nameOf(t.assignee_user_id);
      if (t.assignee_role) {
        const m = members.find((x) => x.team_role === t.assignee_role);
        return `${t.assignee_role}（${m ? m.display_name : "まだいない"}）`;
      }
      return null;
    };

    const milestones = must(await supabase.from("milestones").select("*").eq("team_id", teamId).order("position"), "段階");
    const tasks = must(await supabase.from("tasks").select("*").eq("team_id", teamId), "タスク");
    const questions = must(
      await supabase.from("questions").select("*").eq("team_id", teamId).neq("status", "resolved").order("created_at"),
      "質問"
    );
    const answers = must(await supabase.from("answers").select("*").eq("team_id", teamId).order("created_at"), "答え");

    const shapeAnswer = (a) => ({
      id: a.id,
      by: nameOf(a.answered_by),
      by_ai: roleOf(a.answered_by) === "assistant",
      body: a.body,
      sources: a.sources,
      corrects_answer_id: a.corrects_answer_id,
      created_at: a.created_at,
    });

    teams.push({
      team: { id: team.id, name: team.name, goal: team.goal, goal_date: team.goal_date, repo_url: team.repo_url, statuses: team.statuses },
      // メンバーが AI の答えを直したもの。AI は一番に読み、同じ間違いをしない
      corrections: answers.filter((a) => a.corrects_answer_id).map(shapeAnswer),
      roadmap: milestones.map((m) => ({
        name: m.name,
        start_date: m.start_date,
        due_date: m.due_date,
        description: m.description,
        tasks: tasks
          .filter((t) => t.milestone_id === m.id)
          .map((t) => ({ title: t.title, status: t.status, done_criteria: t.done_criteria, assignee: assigneeOf(t), deadline: t.deadline })),
      })),
      tasks_without_stage: tasks.filter((t) => !t.milestone_id).map((t) => ({ title: t.title, status: t.status, done_criteria: t.done_criteria, assignee: assigneeOf(t) })),
      members: members.filter((m) => m.role !== "assistant").map((m) => ({ name: m.display_name, team_role: m.team_role })),
      questions: questions.map((q) => {
        const qa = answers.filter((a) => a.question_id === q.id);
        return {
          id: q.id,
          status: q.status, // open：まだ誰も答えていない
          asked_by: nameOf(q.asked_by),
          created_at: q.created_at,
          body: q.body,
          answers: qa.map(shapeAnswer),
          ai_already_answered: qa.some((a) => roleOf(a.answered_by) === "assistant"),
        };
      }),
    });
  }
  console.log(JSON.stringify({ fetched_at: new Date().toISOString(), teams }, null, 2));
}

async function answer(questionId, bodyFile, sources) {
  const myId = await login();
  const body = readFileSync(bodyFile, "utf8").trim();
  if (!body) {
    console.error("答えが空です");
    process.exit(1);
  }
  const [q] = must(await supabase.from("questions").select("id, team_id").eq("id", questionId), "質問");
  if (!q) {
    console.error("その質問は見つかりません");
    process.exit(1);
  }
  const res = await supabase
    .from("answers")
    .insert({ question_id: q.id, team_id: q.team_id, body, answered_by: myId, sources: sources ?? null })
    .select("id")
    .single();
  if (res.error) {
    console.error(`書き込めません：${res.error.message}`);
    process.exit(1);
  }
  console.log(`答えを書き込みました（${res.data.id}）`);
}

const [command, ...args] = process.argv.slice(2);
if (command === "fetch") await fetchAll();
else if (command === "answer" && args.length >= 2) await answer(args[0], args[1], args[2]);
else {
  console.error("使い方：node scripts/ai-assistant.mjs fetch | answer <質問id> <ファイル> [参照]");
  process.exit(1);
}
