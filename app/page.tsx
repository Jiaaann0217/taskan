import {supabase} from "@/lib/supabase";
import TaskForm from "./TaskForm";
import TaskEditForm from "./TaskEditForm"

export default async function Home() {
  const { data: tasks, error} = await supabase
    .from("tasks")
    .select("*");

  if(error){
    return <div>エラー：{error.message}</div>;
  }


return (
  <main className="p-8">

    <h1 className ="mb-6 text-3xl font-bold">
      学園祭タスク管理
    </h1>

    <TaskForm />
    
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-lg border p-4"
          >
            <h2 className="text-xl font-bold">
              {task.title}
            </h2>

            <p className="mt-2 text-gray-600">
              {task.description}
            </p>

            <p className="mt-2">
              進捗：{task.progress}%
            </p>

            <p>
              状態：{task.status}
            </p>

            <p>
              締切：{task.deadline ?? "未設定"}
            </p>

            <TaskEditForm task={task} />
        </div>
      ))}
    </div>
  </main>
);
}