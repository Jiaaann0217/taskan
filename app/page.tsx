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
                {task.user?.name ?? "未設定"}
              </td>

              <td className="border p-3">
                {task.status}
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