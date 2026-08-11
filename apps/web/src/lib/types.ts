export const TASK_STATUSES = [
  "BACKLOG",
  "TODO",
  "DOING",
  "COMPLETED",
  "ON_HOLD",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = [
  "NO_PRIORITY",
  "URGENT",
  "HIGH",
  "MEDIUM",
  "LOW",
] as const;
export type Priority = (typeof PRIORITIES)[number];

export const BOARD_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "To Do" },
  { status: "DOING", label: "Doing" },
  { status: "COMPLETED", label: "Completed" },
  { status: "ON_HOLD", label: "On Hold" },
];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  DOING: "Doing",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  NO_PRIORITY: "No Priority",
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export type User = {
  id: string;
  email: string;
  name: string;
  username: string;
  title: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
};

export type Label = {
  id: string;
  name: string;
  color: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;
  lead: User | null;
  position: number;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  startDate: string | null;
  position: number;
  projectId: string | null;
  parentId: string | null;
  project: Pick<Project, "id" | "name"> | null;
  reporter: User | null;
  assignees: User[];
  labels: Label[];
  subtaskCount?: number;
};

export type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: User;
  replies: Comment[];
};

export type Activity = {
  id: string;
  field: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  actor: User | null;
};

export type Session = {
  user: User;
  workspace: Workspace;
  token: string;
};
