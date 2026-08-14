"use client";

import Link from "next/link";
import { GripVertical, MoreHorizontal, Plus } from "lucide-react";

import { PriorityIcon } from "@/components/priority-badge";
import { DueDateChip, LabelChips } from "@/components/task-meta";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BOARD_COLUMNS, type Task, type TaskStatus } from "@/lib/types";
import type { FieldVisibility } from "@/hooks/use-task-view";

export function TaskBoard({
  tasks,
  fields,
  onAddTask,
  onMoveTask,
}: {
  tasks: Task[];
  fields: FieldVisibility;
  onAddTask: (status: TaskStatus) => void;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
}) {
  return (
    <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
      {BOARD_COLUMNS.map((column) => (
        <BoardColumn
          key={column.status}
          status={column.status}
          label={column.label}
          tasks={tasks.filter((task) => task.status === column.status)}
          fields={fields}
          onAddTask={onAddTask}
          onMoveTask={onMoveTask}
        />
      ))}
    </div>
  );
}

function BoardColumn({
  status,
  label,
  tasks,
  fields,
  onAddTask,
  onMoveTask,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  fields: FieldVisibility;
  onAddTask: (status: TaskStatus) => void;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
}) {
  return (
    <section
      aria-label={label}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const taskId = event.dataTransfer.getData("text/plain");
        if (taskId) onMoveTask(taskId, status);
      }}
      className="flex w-72 shrink-0 flex-col self-start rounded-lg border"
    >
      <header className="flex items-center gap-1.5 border-b px-3 py-2">
        <GripVertical className="text-muted-foreground size-3.5" />
        <h2 className="text-sm font-medium">{label}</h2>
        <div className="ml-auto flex items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Add task to ${label}`}
            onClick={() => onAddTask(status)}
          >
            <Plus />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`${label} options`}>
            <MoreHorizontal />
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-2 p-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} fields={fields} />
        ))}

        <button
          type="button"
          onClick={() => onAddTask(status)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm",
            "text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors",
          )}
        >
          <Plus className="size-3.5" />
          Add Task
        </button>
      </div>
    </section>
  );
}

function TaskCard({ task, fields }: { task: Task; fields: FieldVisibility }) {
  const assignee = task.assignees[0];

  return (
    <article
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/plain", task.id)}
      className={cn(
        "bg-card flex cursor-grab flex-col gap-2 rounded-lg border p-3 shadow-xs",
        "active:cursor-grabbing",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/tasks/${task.id}`}
          className="text-sm font-medium hover:underline"
        >
          {task.title}
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          className="-mt-1 -mr-1 shrink-0"
          aria-label={`Actions for ${task.title}`}
        >
          <MoreHorizontal />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {fields.priority && <PriorityIcon priority={task.priority} />}
          {fields.members && assignee && (
            <>
              <UserAvatar user={assignee} />
              <span className="text-muted-foreground truncate text-xs">
                {assignee.name}
              </span>
            </>
          )}
        </div>
        {fields.dueDate && task.dueDate && <DueDateChip date={task.dueDate} />}
      </div>

      {fields.labels && task.labels.length > 0 && (
        <LabelChips labels={task.labels} max={2} />
      )}
    </article>
  );
}
