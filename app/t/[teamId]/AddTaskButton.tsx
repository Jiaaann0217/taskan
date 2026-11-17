"use client";

import { useState } from "react";
import type { Milestone, TeamMember } from "@/lib/types";
import TaskForm from "./TaskForm";

type Props = {
  teamId: string;
  statuses: string[];
  milestones: Milestone[];
  members: TeamMember[];
  milestoneId: string | null; // どの段階に足すか
};

// 「＋ タスクを足す」。押すとフォームが開く
export default function AddTaskButton(props: Props) {
  const [open, setOpen] = useState(false);

  if (open) {
    return <TaskForm {...props} defaultMilestoneId={props.milestoneId} onDone={() => setOpen(false)} />;
  }
  return (
    <button
      onClick={() => setOpen(true)}
      className="w-full rounded border border-dashed px-3 py-1 text-left text-sm text-gray-600 hover:bg-white"
    >
      ＋ タスクを足す
    </button>
  );
}
