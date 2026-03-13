export type FigmaFile = {
  id: string;
  name: string;
  url: string;
  color?: string;
  lastModified?: string;
};

export type AiMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  timestamp: number;
};

export type CommItem = {
  id: string;
  source: "mail" | "teams";
  sender: string;
  title: string;
  timestamp: string;
  isRead: boolean;
  url?: string;
};

export type TaskItem = {
  task: string;
  status: "todo" | "doing" | "done";
  dueDate?: string;
  priority: "low" | "medium" | "high";
};

export type PomodoroState = {
  isRunning: boolean;
  mode: "focus" | "break";
  remainingSeconds: number;
  completedSessions: number;
};

export type DailyNote = {
  date: string;
  memo: string;
  checklist: { id: string; text: string; done: boolean }[];
};

