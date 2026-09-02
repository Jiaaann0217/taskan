import {supabase} from "@/lib/supabase";
import TaskForm from "./TaskForm";
import TaskEditForm from "./TaskEditForm"

export default async function Home() {
  const { data: tasks, error} = await supabase
    .from("tasks")
    .select(`
      *,
      users (
        name
      )
    `);

  if(error){
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
  <main className="min-h-screen bg-gray-300 p-8 text-gray-900">

    <h1 className ="mb-6 text-3xl font-bold">
      学園祭タスク管理
    </h1>

    <TaskForm />
    
    <div className="overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-lg border-2 border-gray-900">
        <thead>
          <tr className ="bg-blue-600 text-white">
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
          {tasks.map((task) =>(
            <tr key={task.id}>
              <td className="border p-3 font-medium">
                {task.title}
              </td>

              <td className="border p-3">
                {task.users?.name ?? "未設定"}
              </td>

              <td className="border">
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                statusStyles[task.status] ?? "bg-gray-100 text-gray-700"
                }`}
                >
                {task.status}
                </span>
              </td>

              <td className="border p-3">
                {task.progress}%
              </td>

              <td className="border p-3">
                {task.start_date ?? "未設定"}
              </td>

              <td className="border p-3">
                {task.deadline ?? "未設定"}
              </td>

              <td className="border p-3">
                <TaskEditForm task={task} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </main>
);
}