"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [users, setUsers] = useState<
  { id: string; name: string}[]
  >([]);
  const [assigneeId, setassigneeId] = useState("");

  useEffect(() =>{
    const fetchUsers = async () => {
      const {data, error} = await supabase
        .from("users")
        .select("id, name");
      
      console.log("users data:" , data);
      console.log("users error:", error);

      if (error) {
        console.error(error);
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

    const { error } = await supabase
    .from("tasks")
    .insert({
      title,
      description,
      deadline: deadline || null,
      assignee_id: assigneeId || null,
    });

    if (error) {
      console.error(error);
      return;
    }

    setTitle("");
    setDescription("");
    setDeadline("");

    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 space-y-4">
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
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="rounded border p-2"
        />


      <select
        value={assigneeId}
        onChange={(e) => setassigneeId(e.target.value)}
        className="w-full rounded border p-2"
        >
          <option value="">担当者を選択</option>

          {users.map((user) =>(
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
          >
            タスクを追加
          </button>
    </form>
  );

}