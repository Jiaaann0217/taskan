"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"

type Task = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  assignee_id: string | null;
  status: string | null;
  progress: number | null;
};

type Props = {
  task: Task;
};

export default function TaskEditForm({ task }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(
    task.description ?? ""
  );
  const [deadline, setDeadline] = useState(
    task.deadline ?? ""
  );
  const [assigneeId, setAssigneeId] = useState(
    task.assignee_id ?? ""
  );
  const [status, setStatus] = useState(task.status ?? "未着手");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [progress, setProgress] = useState(task.progress ?? 0);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name")

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

    const { data, error } = await supabase
      .from("tasks")
      .update({
        title,
        description,
        deadline: deadline || null,
        assignee_id: assigneeId || null,
        status,
        progress,
      })
      .eq("id", task.id)
      .select();

    console.log("更新結果：", data);
    console.log("更新エラー：", error);

    if (error) {
      console.error(error);
      return;
    }

    setIsEditing(false);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "このタスクを削除しますか？"
    );

    if (!confirmed) {
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
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="rounded border px-3 py-1"
      >
        編集
      </button>

      {isEditing && (
      <div className="fixed inset-0 z-50 flex items-center bg-black/50">
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-3 rounded-lg bg-gray-50 p-4"
        >

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border p-2"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border p-2"
          />

          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="rounded border p-2"
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

          <label className="block">
            <span className="mb-1 block">進捗率</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full"
          />
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
          </select>

          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            保存
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded border px-4 py-2 ml-2"
          >
            キャンセル
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="rounded bg-red-600 px-4 py-2 ml-2 text-white"
          >
            削除
          </button>
        </form>
      </div>
      )}
    </div>
  )
}