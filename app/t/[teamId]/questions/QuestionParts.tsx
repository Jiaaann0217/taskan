"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Answer, Question, TeamMember } from "@/lib/types";

const statusLabel = { open: "未回答", answered: "回答あり", resolved: "解決" };
const statusStyle = {
  open: "bg-yellow-100 text-yellow-800",
  answered: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

// 質問を書く
export function AskForm({ teamId, myId }: { teamId: string; myId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("questions").insert({ team_id: teamId, body, asked_by: myId });
    if (error) {
      setMessage(`送れませんでした：${error.message}`);
      return;
    }
    setBody("");
    setMessage("");
    router.refresh();
  };

  return (
    <form onSubmit={ask} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="例：ログイン後の画面遷移は、どのファイルで決めていますか？"
        rows={3}
        required
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <button className="rounded bg-gray-900 px-4 py-1.5 text-sm text-white hover:bg-gray-700">質問する</button>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </form>
  );
}

type CardProps = {
  question: Question;
  answers: Answer[];
  members: TeamMember[];
  myId: string;
  canAnswer: boolean;
  canResolve: boolean;
};

// 質問1件と、その答え
export function QuestionCard({ question, answers, members, myId, canAnswer, canResolve }: CardProps) {
  const router = useRouter();
  const member = (userId: string) => members.find((m) => m.user_id === userId);
  const nameOf = (userId: string) => member(userId)?.display_name ?? "（抜けた人）";
  const isAI = (userId: string) => member(userId)?.role === "assistant";

  // 訂正は、直した答えの下にまとめて出す
  const mainAnswers = answers.filter((a) => !a.corrects_answer_id);
  const correctionsOf = (id: string) => answers.filter((a) => a.corrects_answer_id === id);

  const setStatus = async (status: Question["status"]) => {
    await supabase
      .from("questions")
      .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null })
      .eq("id", question.id);
    router.refresh();
  };

  const remove = async () => {
    if (!confirm("この質問を消しますか？（答えも消えます）")) return;
    await supabase.from("questions").delete().eq("id", question.id);
    router.refresh();
  };

  return (
    <article className="rounded border bg-white p-4 shadow-sm">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className={`rounded px-1.5 py-0.5 ${statusStyle[question.status]}`}>{statusLabel[question.status]}</span>
        <span>{nameOf(question.asked_by)}</span>
        <span>{question.created_at.slice(0, 16).replace("T", " ")}</span>
      </div>
      <p className="whitespace-pre-wrap">{question.body}</p>

      <div className="mt-3 space-y-2">
        {mainAnswers.map((a) => (
          <AnswerView
            key={a.id}
            answer={a}
            corrections={correctionsOf(a.id)}
            nameOf={nameOf}
            isAI={isAI}
            myId={myId}
            canCorrect={canAnswer && isAI(a.answered_by)}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t pt-2 text-sm">
        {canAnswer && <AnswerForm question={question} myId={myId} label="答える" />}
        {canResolve && question.status !== "resolved" && (
          <button onClick={() => setStatus("resolved")} className="text-green-700 hover:underline">解決にする</button>
        )}
        {canResolve && question.status === "resolved" && (
          <button onClick={() => setStatus(mainAnswers.length ? "answered" : "open")} className="text-gray-600 hover:underline">
            解決を取り消す
          </button>
        )}
        {canResolve && (
          <button onClick={remove} className="ml-auto text-xs text-red-600 hover:underline">消す</button>
        )}
      </div>
    </article>
  );
}

type AnswerViewProps = {
  answer: Answer;
  corrections: Answer[];
  nameOf: (id: string) => string;
  isAI: (id: string) => boolean;
  myId: string;
  canCorrect: boolean;
};

function AnswerView({ answer, corrections, nameOf, isAI, myId, canCorrect }: AnswerViewProps) {
  const router = useRouter();
  const ai = isAI(answer.answered_by);

  const remove = async () => {
    if (!confirm("この答えを消しますか？")) return;
    await supabase.from("answers").delete().eq("id", answer.id);
    router.refresh();
  };

  return (
    <div className={`rounded p-3 text-sm ${ai ? "bg-purple-50" : "bg-gray-50"}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {ai ? (
          <span className="rounded bg-purple-200 px-1.5 py-0.5 text-purple-900">AI の回答</span>
        ) : (
          <span className="font-bold text-gray-700">{nameOf(answer.answered_by)}</span>
        )}
        <span>{answer.created_at.slice(0, 16).replace("T", " ")}</span>
        {corrections.length > 0 && <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">訂正あり</span>}
        {answer.answered_by === myId && (
          <button onClick={remove} className="ml-auto text-red-600 hover:underline">消す</button>
        )}
      </div>
      <p className={`whitespace-pre-wrap ${corrections.length > 0 ? "text-gray-500" : ""}`}>{answer.body}</p>
      {answer.sources && <p className="mt-1 text-xs text-gray-500">参照：{answer.sources}</p>}

      {corrections.map((c) => (
        <div key={c.id} className="mt-2 rounded border-l-4 border-red-400 bg-white p-2">
          <div className="text-xs text-red-700">訂正：{nameOf(c.answered_by)}</div>
          <p className="whitespace-pre-wrap">{c.body}</p>
        </div>
      ))}

      {canCorrect && (
        <div className="mt-2 text-xs">
          <AnswerForm
            question={{ id: answer.question_id, team_id: answer.team_id }}
            myId={myId}
            correctsAnswerId={answer.id}
            label="訂正する"
          />
        </div>
      )}
    </div>
  );
}

type AnswerFormProps = {
  question: Pick<Question, "id" | "team_id">;
  myId: string;
  correctsAnswerId?: string;
  label: string;
};

// 答える・訂正する（訂正も答えの一種として保存し、どの答えを直したかを残す）
function AnswerForm({ question, myId, correctsAnswerId, label }: AnswerFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("answers").insert({
      question_id: question.id,
      team_id: question.team_id,
      body,
      answered_by: myId,
      corrects_answer_id: correctsAnswerId ?? null,
    });
    if (error) {
      setMessage(`送れませんでした：${error.message}`);
      return;
    }
    setBody("");
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={correctsAnswerId ? "text-red-600 hover:underline" : "text-blue-700 hover:underline"}>
        {label}
      </button>
    );
  }

  return (
    <form onSubmit={send} className="w-full space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={correctsAnswerId ? "正しい内容（AI は次から、これを最初に読みます）" : "答え"}
        rows={3}
        required
        className="w-full rounded border px-2 py-1 text-sm"
      />
      <div className="flex gap-2">
        <button className="rounded bg-gray-900 px-3 py-1 text-sm text-white hover:bg-gray-700">送る</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border px-3 py-1 text-sm">やめる</button>
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </form>
  );
}
