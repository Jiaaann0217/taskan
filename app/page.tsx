import { supabase } from "@/lib/supabase";
import TaskEditForm from "./TaskEditForm";
import TaskList from "./TaskList";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(`
      *,
      users (
        name
      )
    `);

  if (error) {
    return <div>エラー：{error.message}</div>;
  }

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

  return (
    <main className="min-h-screen bg-gray-300 p-4 md:p-8 text-gray-900">

      <h1 className="mb-6 text-3xl font-bold">
        学園祭タスク管理
      </h1>

      <TaskEditForm mode="create" />

      <TaskList tasks={tasks ?? []} />
    </main>
  );
}