"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Task = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  deadline: string | null;
  assignee_id: string | null;
  status: string | null;
  progress: number | null;
};

type Props = {
  mode: "create" | "edit";
  task?: Task;
};

export default function TaskEditForm({ mode, task }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [startDate, setStartDate] = useState(task?.start_date ?? "");
  const [deadline, setDeadline] = useState(task?.deadline ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? "");
  const [status, setStatus] = useState(task?.status ?? "未着手");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [progress, setProgress] = useState(task?.progress ?? 0);
  const [newUserName, setNewUserName] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name");

      if (error) {
        console.error("users取得エラー:", error);
        return;
      }

      setUsers(data);
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      return;
    }

    let finalAssigneeId = assigneeId;

    if (assigneeId === "_new_") {
      if (!newUserName) {
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .insert({ name: newUserName })
        .select("id")
        .single();

      if (error) {
        console.error("ユーザー追加エラー:", error);
        return;
      }

      finalAssigneeId = data.id;
    }

    if (mode === "create") {
      const { error } = await supabase
        .from("tasks")
        .insert({
          title,
          description,
          start_date: startDate || null,
          deadline: deadline || null,
          assignee_id: finalAssigneeId || null,
          status,
          progress,
        });

      if (error) {
        console.error("タスク追加エラー:", error);
        return;
      }
    } else {
      const { error } = await supabase
        .from("tasks")
        .update({
          title,
          description,
          start_date: startDate || null,
          deadline: deadline || null,
          assignee_id: finalAssigneeId || null,
          status,
          progress,
        })
        .eq("id", task!.id);

      if (error) {
        console.error("タスク更新エラー:", error);
        return;
      }
    }

    setIsEditing(false);
    window.location.reload();
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("このタスクを削除しますか？");

    if (!confirmed || !task) {
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", task.id);

    if (error) {
      console.error("削除エラー：", error);
      return;
    }

    setIsEditing(false);
    window.location.reload();
  };

  return (
    <div>
      {mode === "create" ? (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="mb-6 rounded border px-3 py-2"
        >
          新規タスクを追加
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded border px-3 py-1"
        >
          編集
        </button>
        )}

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg space-y-3 rounded-lg bg-gray-50 p-4"
          >
            <h2 className="text-xl font-bold text-gray-900">
              {mode === "create" ? "新規タスクを追加" : "タスクを編集"}
            </h2>

            <input
              type="text"
              placeholder="タスク名"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border p-2"
            />

            <textarea
              placeholder="説明"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border p-2"
            />

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded border p-2"
              aria-label="開始日"
            />

            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded border p-2"
              aria-label="締切日"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded border bg-white p-2 text-gray-900"
            >
              <option value="未着手">未着手</option>
              <option value="Figma制作中">Figma制作中</option>
              <option value="Figma確認中">Figma確認中</option>
              <option value="Figma完了">Figma完了</option>
              <option value="実装中">実装中</option>
              <option value="プルリク確認中">プルリク確認中</option>
              <option value="手直し中">手直し中</option>
              <option value="完成">完成</option>
            </select>

            <label className="block text-gray-900">
              <span className="mb-1 block">進捗率：{progress}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full"
              />
            </label>

            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">担当者を選択</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}

              <option value="_new_">新しい担当者を追加</option>
            </select>

            {assigneeId === "_new_" && (
              <input
                type="text"
                placeholder="新しい担当者の名前"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full rounded border p-2"
              />
            )}

            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              {mode === "create" ? "タスクを追加" : "保存"}
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="ml-2 rounded border px-4 py-2"
            >
              キャンセル
            </button>

            {mode === "edit" && (
              <button
                type="button"
                onClick={handleDelete}
                className="ml-2 rounded bg-red-600 px-4 py-2 text-white"
              >
                削除
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
