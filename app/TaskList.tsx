"use client";

import {useMemo, useState} from "react";
import TaskEditForm from "./TaskEditForm";

type Task = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  deadline: string | null;
  assignee_id: string | null;
  status: string | null;
  progress: number | null;
  created_at: string;
  users: {
    name: string;
  } | null;
};
  
type Props = {
  tasks: Task[];
};

export default function TaskList({ tasks }: Props) {
  const [sortBy, setSortBy] = useState("deadline");
  const [sortOrder, setSortOrder] = useState("desc");

  const statusStyles: Record<string, string> = {
    "未着手": "bg-gray-100 text-gray-700",
    "Figma制作中": "bg-purple-100 text-purple-700",
    "Figma確認中": "bg-yellow-100 text-yellow-700",
    "Figma完了": "bg-green-100 text-green-700",
    "実装中": "bg-blue-100 text-blue-700",
    "プルリク確認中": "bg-orange-100 text-orange-700",
    "手直し中": "bg-red-100 text-red-700",
    "完成": "bg-emerald-100 text-emerald-700",
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let result = 0;

      if (sortBy === "deadline") {
        if(!a.deadline && !b.deadline) {
          result = 0;
        } else if(!a.deadline) {
          result = 1;
        } else if(!b.deadline) {
          result = -1;
        }else {
          result = 
          new Date(a.deadline).getTime() - 
          new Date(b.deadline).getTime();
        }
      }

      if (sortBy === "start_date") {
        if(!a.start_date && !b.start_date) {
          result = 0;
        } else if(!a.start_date) {
          result = 1;
        } else if(!b.start_date) {
          result = -1;
        }else {
          result = 
          new Date(a.start_date).getTime() - 
          new Date(b.start_date).getTime();
        }
      }

      if(sortBy === "progress"){
        result = (a.progress ?? 0) - (b.progress ?? 0);
      }
      
      if(sortBy === "title"){
        result = a.title.localeCompare(b.title, "ja");
      }

      return sortOrder === "asc" ? result : -result;
    });
  }, [tasks, sortBy, sortOrder]);

return (
    <>
      {/* 並び替え */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">
          並び替え：
        </span>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded border bg-white px-3 py-2 text-sm"
        >
          <option value="deadline">締切日</option>
          <option value="start_date">開始日</option>
          <option value="progress">進捗率</option>
          <option value="title">タスク名</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="rounded border bg-white px-3 py-2 text-sm"
        >
          <option value="asc">
            {sortBy === "deadline"
              ? "締切が近い順"
              : sortBy === "start_date"
              ? "開始日が近い順"
              : sortBy === "progress"
              ? "進捗率が低い順"
              : "A→Z"}
          </option>
          <option value="desc">
            {sortBy === "deadline"
              ? "締切が遠い順"
              : sortBy === "start_date"
              ? "開始日が遠い順"
              : sortBy === "progress"
              ? "進捗率が高い順"
              : "Z→A"}
          </option>
        </select>
      </div>

      {/* スマホ */}
      <div className="space-y-2 md:hidden">
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            className="w-full min-w-0 rounded-lg bg-white p-3 shadow"
          >
            <details>
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-medium">
                    {task.title}
                  </p>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                      statusStyles[task.status ?? ""] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">
                    {task.users?.name ?? "未設定"}
                  </span>

                  <span className="shrink-0">
                    {task.progress ?? 0}%
                  </span>
                </div>

                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${task.progress ?? 0}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between gap-3 text-xs text-gray-500">
                  <span>
                    開始：{task.start_date ?? "未設定"}
                  </span>

                  <span>
                    締切：{task.deadline ?? "未設定"}
                  </span>
                </div>
              </summary>

              <div className="mt-3 border-t pt-3">
                <p className="text-sm text-gray-700">
                  {task.description ?? "説明なし"}
                </p>
              </div>
            </details>

            <div className="mt-2 flex justify-end">
              <TaskEditForm mode="edit" task={task} />
            </div>
          </div>
        ))}
      </div>

      {/* PC */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full overflow-hidden rounded-lg border-2 border-gray-900">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border p-3">タスク</th>
              <th className="border p-3">担当</th>
              <th className="border p-3">状態</th>
              <th className="border p-3">進捗</th>
              <th className="border p-3">開始日</th>
              <th className="border p-3">締切</th>
              <th className="border p-3">操作</th>
            </tr>
          </thead>

          <tbody>
            {sortedTasks.map((task) => (
              <tr key={task.id}>
                <td className="border p-3 font-medium">
                  {task.title}
                </td>

                <td className="border p-3">
                  {task.users?.name ?? "未設定"}
                </td>

                <td className="border p-3">
                  <span
                    className={`rounded-full px-2 py-1 text-sm ${
                      statusStyles[task.status ?? ""] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {task.status}
                  </span>
                </td>

                <td className="border p-3">
                  {task.progress ?? 0}%
                </td>

                <td className="border p-3">
                  {task.start_date ?? "未設定"}
                </td>

                <td className="border p-3">
                  {task.deadline ?? "未設定"}
                </td>

                <td className="border p-3">
                  <TaskEditForm mode="edit" task={task} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}