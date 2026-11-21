import { loadTeam } from "@/lib/team-data";
import type { Answer, Question } from "@/lib/types";
import AppHeader from "../../../AppHeader";
import { AskForm, QuestionCard } from "./QuestionParts";

export const dynamic = "force-dynamic";

// 質問箱：わからないことを書きためる。AI（9時と22時）とメンバーが答える
export default async function QuestionsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const { supabase, team, members, myId, canEdit, isOwner } = await loadTeam(teamId);

  const [questionsRes, answersRes] = await Promise.all([
    supabase.from("questions").select("*").eq("team_id", teamId).order("created_at", { ascending: false }),
    supabase.from("answers").select("*").eq("team_id", teamId).order("created_at"),
  ]);
  const questions = (questionsRes.data ?? []) as Question[];
  const answers = (answersRes.data ?? []) as Answer[];

  const groups = [
    { key: "open", label: "未回答", list: questions.filter((q) => q.status === "open") },
    { key: "answered", label: "回答あり（解決待ち）", list: questions.filter((q) => q.status === "answered") },
  ];
  const resolved = questions.filter((q) => q.status === "resolved");

  const card = (q: Question) => (
    <QuestionCard
      key={q.id}
      question={q}
      answers={answers.filter((a) => a.question_id === q.id)}
      members={members}
      myId={myId ?? ""}
      canAnswer={canEdit}
      canResolve={q.asked_by === myId || isOwner}
    />
  );

  return (
    <main className="min-h-screen w-full px-4 py-4 text-gray-900 md:px-8 md:py-6">
      <AppHeader team={{ id: team.id, name: team.name }} current="questions" />

      {canEdit && (
        <section className="mb-6 rounded bg-white p-4 shadow-sm">
          <h2 className="mb-1 font-bold">質問する</h2>
          <p className="mb-2 text-xs text-gray-500">
            未回答の質問には、AI が毎日 9時と22時に答えます。メンバーも答えられます。
          </p>
          <AskForm teamId={team.id} myId={myId ?? ""} />
        </section>
      )}

      {groups.map((g) => (
        <section key={g.key} className="mb-6">
          <h2 className="mb-2 font-bold">
            {g.label} <span className="text-sm font-normal text-gray-500">{g.list.length}</span>
          </h2>
          {g.list.length === 0 ? <p className="text-sm text-gray-500">ありません</p> : <div className="space-y-3">{g.list.map(card)}</div>}
        </section>
      ))}

      <details className="mb-6">
        <summary className="cursor-pointer font-bold">
          解決済み <span className="text-sm font-normal text-gray-500">{resolved.length}</span>
        </summary>
        <div className="mt-2 space-y-3">{resolved.map(card)}</div>
      </details>
    </main>
  );
}
