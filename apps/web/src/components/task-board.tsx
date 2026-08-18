"use client";

import { useState } from "react";
import Link from "next/link";
import { GripVertical, MoreHorizontal, Plus, UserRound } from "lucide-react";

import { PriorityIcon } from "@/components/priority-badge";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { STATUS_DOT } from "@/components/task-fields";
import { DueDateChip, LabelChips, MemberAvatars } from "@/components/task-meta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BOARD_COLUMNS,
  STATUS_LABEL,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import type { FieldVisibility } from "@/hooks/use-task-view";

export function TaskBoard({
  tasks,
  fields,
  onAddTask,
  onMoveTask,
  onDeleteTask,
}: {
  tasks: Task[];
  fields: FieldVisibility;
  onAddTask: (status: TaskStatus) => void;
  onMoveTask: (taskId: string, status: TaskStatus, position: number) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);

  return (
    <div className="flex flex-1 items-start gap-3 overflow-x-auto pb-2">
      {BOARD_COLUMNS.map((column) => (
        <BoardColumn
          key={column.status}
          status={column.status}
          label={column.label}
          tasks={tasks.filter((task) => task.status === column.status)}
          fields={fields}
          dragging={dragging}
          onDragStateChange={setDragging}
          onAddTask={onAddTask}
          onMoveTask={onMoveTask}
          onDeleteTask={onDeleteTask}
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
  dragging,
  onDragStateChange,
  onAddTask,
  onMoveTask,
  onDeleteTask,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  fields: FieldVisibility;
  dragging: string | null;
  onDragStateChange: (taskId: string | null) => void;
  onAddTask: (status: TaskStatus) => void;
  onMoveTask: (taskId: string, status: TaskStatus, position: number) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function drop(index: number) {
    if (!dragging) return;
    onMoveTask(dragging, status, index);
    setDropIndex(null);
    onDragStateChange(null);
  }

  return (
    <section
      aria-label={label}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setDropIndex(null);
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        drop(dropIndex ?? tasks.length);
      }}
      className={cn(
        "flex w-72 shrink-0 flex-col self-start rounded-lg border transition-colors",
        dragging && "border-dashed",
        dropIndex !== null && "border-primary/40 bg-primary/[0.03]",
      )}
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

      <div className="flex flex-col p-2">
        {tasks.map((task, index) => (
          <div key={task.id}>
            <DropSlot
              active={dropIndex === index}
              edge={index === 0 ? "start" : undefined}
              onDragOver={() => setDropIndex(index)}
              onDrop={() => drop(index)}
            />
            <TaskCard
              task={task}
              fields={fields}
              isDragging={dragging === task.id}
              onDragStart={() => onDragStateChange(task.id)}
              onDragEnd={() => {
                onDragStateChange(null);
                setDropIndex(null);
              }}
              onDragOver={(half) =>
                setDropIndex(half === "top" ? index : index + 1)
              }
              onDelete={() => onDeleteTask(task.id)}
            />
          </div>
        ))}

        <DropSlot
          active={dropIndex === tasks.length}
          edge="end"
          onDragOver={() => setDropIndex(tasks.length)}
          onDrop={() => drop(tasks.length)}
        />

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

function DropSlot({
  active,
  edge,
  onDragOver,
  onDrop,
}: {
  active: boolean;
  edge?: "start" | "end";
  onDragOver: () => void;
  onDrop: () => void;
}) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDrop();
      }}
      className={cn(
        "flex items-center transition-all duration-150",
        active ? "h-8" : "h-2",
      )}
    >
      <span
        className={cn(
          "bg-primary block h-0.5 rounded-full transition-all duration-150",
          active ? "w-full opacity-100" : "w-0 opacity-0",
          edge === "start" && "mt-0.5",
          edge === "end" && "mb-0.5",
          edge && active && "mx-2",
        )}
      />
    </div>
  );
}

function TaskCard({
  task,
  fields,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDelete,
}: {
  task: Task;
  fields: FieldVisibility;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (half: "top" | "bottom") => void;
  onDelete: () => void;
}) {
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        const box = event.currentTarget.getBoundingClientRect();
        onDragOver(event.clientY < box.top + box.height / 2 ? "top" : "bottom");
      }}
      className={cn(
        "bg-muted/40 flex cursor-grab flex-col gap-2 rounded-lg border p-3 shadow-xs",
        "transition-all duration-150 active:cursor-grabbing",
        isDragging && "scale-[0.98] opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/tasks/${task.id}`}
          className="text-sm font-medium hover:underline"
        >
          {task.title}
        </Link>
        <RowActionsMenu
          editHref={`/tasks/${task.id}`}
          label={task.title}
          onDelete={onDelete}
          className="-mt-1 -mr-1"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {fields.priority && <PriorityIcon priority={task.priority} />}
          {fields.members && task.assignees.length > 0 && (
            <>
              <MemberAvatars members={task.assignees} max={3} />
              {task.assignees.length === 1 && (
                <span className="truncate text-xs font-semibold">
                  {task.assignees[0].name}
                </span>
              )}
            </>
          )}
        </div>
        {fields.dueDate && task.dueDate && <DueDateChip date={task.dueDate} />}
      </div>

      {(fields.status || fields.reporter) && (
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {fields.status && (
            <span className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", STATUS_DOT[task.status])} />
              {STATUS_LABEL[task.status]}
            </span>
          )}
          {fields.reporter && (
            <span className="flex items-center gap-1">
              <UserRound className="size-3" />
              {task.reporter?.name ?? "—"}
            </span>
          )}
        </div>
      )}

      {fields.labels && task.labels.length > 0 && (
        <LabelChips labels={task.labels} max={2} />
      )}
    </article>
  );
}
