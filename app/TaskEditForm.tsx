"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"

type Task = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
};

type Props = {
  task: Task;
};

export default function TaskEditForm({ task }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(
    task.description ?? ""
  );
  const [deadline, setDeadline] = useState(
    task.deadline ?? ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("tasks")
      .update({
        title,
        description,
        deadline: deadline || null,
      })
      .eq("id", task.id)
      .select();

      console.log("更新結果：", data);
      console.log("更新エラー：", error);

    if (error) {
      console.error(error);
      return;
    }

    window.location.reload();
  };

      const handleDelete = async () => {
      const confirmed = window.confirm(
        "このタスクを削除しますか？"
      );

      if(!confirmed) {
        return;
      }

      const {error} = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);

      if(error) {
        console.error("削除エラー：", error);
        return;
      }

      window.location.reload();
    }

  return (
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

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        保存
      </button>

      <button
        type="button"
        onClick={handleDelete}
        className="rounded bg-red-600 px-4 py-2 text-white"
        >
          削除
        </button>
    </form>
  )
}