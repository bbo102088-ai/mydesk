"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Plus, Trash2 } from "lucide-react";

type TaskStatus = "todo" | "doing" | "done" | "hold";
type TaskPriority = "low" | "medium" | "high";

type Task = {
  id: string;
  task: string;
  status: TaskStatus;
  dueDate?: string;
  priority: TaskPriority;
};

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    task: "진료화면 리뉴얼 기획서 작성",
    status: "doing",
    dueDate: "2026-03-15",
    priority: "high",
  },
  {
    id: "2",
    task: "EMR 대시보드 사용자 인터뷰",
    status: "todo",
    dueDate: "2026-03-17",
    priority: "medium",
  },
  {
    id: "3",
    task: "UI 컴포넌트 스펙 정리",
    status: "done",
    dueDate: "2026-03-10",
    priority: "medium",
  },
  {
    id: "4",
    task: "보안팀 검토 요청",
    status: "hold",
    dueDate: "2026-03-20",
    priority: "low",
  },
  {
    id: "5",
    task: "스프린트 회고 자료 준비",
    status: "todo",
    dueDate: "2026-03-14",
    priority: "high",
  },
];

const STATUS_CYCLE: TaskStatus[] = ["todo", "doing", "done", "hold"];

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "대기",
  doing: "진행중",
  done: "완료",
  hold: "보류",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-white/10 text-white/55",
  doing: "bg-amber-500/20 text-amber-300",
  done: "bg-emerald-500/20 text-emerald-300",
  hold: "bg-red-500/20 text-red-300",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  high: "bg-red-500/20 text-red-300",
  medium: "bg-amber-500/20 text-amber-300",
  low: "bg-white/10 text-white/45",
};

export function WorkSheet() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    "mydesk:tasks",
    INITIAL_TASKS
  );
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");

  const cycleStatus = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id !== id) return t;
        const idx = STATUS_CYCLE.indexOf(t.status);
        return { ...t, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] };
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      task: newTask.trim(),
      status: "todo",
      dueDate: newDue || undefined,
      priority: newPriority,
    };
    setTasks([...tasks, task]);
    setNewTask("");
    setNewDue("");
    setNewPriority("medium");
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">업무 시트</CardTitle>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowForm(!showForm)}
            className="text-white/60 hover:text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            태스크 추가
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
            <input
              type="text"
              placeholder="태스크명"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-indigo-400/80"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 outline-none focus:border-indigo-400/80 [color-scheme:dark]"
              />
              <select
                value={newPriority}
                onChange={(e) =>
                  setNewPriority(e.target.value as TaskPriority)
                }
                className="bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white/80 outline-none [color-scheme:dark]"
              >
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addTask} className="flex-1">
                추가
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="text-white/60"
              >
                취소
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/35 text-xs border-b border-white/10">
                <th className="text-left pb-2.5 font-medium">Task</th>
                <th className="text-center pb-2.5 font-medium w-20">Status</th>
                <th className="text-center pb-2.5 font-medium w-24">Due</th>
                <th className="text-center pb-2.5 font-medium w-16">
                  Priority
                </th>
                <th className="w-8 pb-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tasks.map((task) => (
                <tr key={task.id} className="group transition-colors hover:bg-white/[0.03]">
                  <td className="py-2.5 pr-3 text-white/75 text-sm">
                    {task.task}
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => cycleStatus(task.id)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-opacity hover:opacity-75 ${STATUS_STYLES[task.status]}`}
                    >
                      {STATUS_LABELS[task.status]}
                    </button>
                  </td>
                  <td className="py-2.5 text-center text-xs text-white/45">
                    {task.dueDate ?? "—"}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}
                    >
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition-all"
                      aria-label="태스크 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-white/25 text-sm"
                  >
                    태스크가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
