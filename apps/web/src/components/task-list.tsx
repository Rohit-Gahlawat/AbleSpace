"use client";

import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";

import { PriorityBadge } from "@/components/priority-badge";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { LabelChips, MemberAvatars, formatDueDate } from "@/components/task-meta";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type Task, type TaskStatus } from "@/lib/types";
import type { FieldVisibility } from "@/hooks/use-task-view";

export const LIST_GROUPS: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "DOING",
  "COMPLETED",
  "ON_HOLD",
];

export function TaskList({
  tasks,
  fields,
  onAddTask,
  onDeleteTask,
}: {
  tasks: Task[];
  fields: FieldVisibility;
  onAddTask: (status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const groups = LIST_GROUPS.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
  })).filter((group) => group.tasks.length > 0);

  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        No tasks match the current filters.
      </p>
    );
  }

  return (
    <div className="animate-in fade-in flex flex-col gap-4 duration-300 ease-out">
      {groups.map((group) => (
        <TaskGroup
          key={group.status}
          status={group.status}
          tasks={group.tasks}
          fields={fields}
          onAddTask={onAddTask}
          onDeleteTask={onDeleteTask}
        />
      ))}
    </div>
  );
}

function TaskGroup({
  status,
  tasks,
  fields,
  onAddTask,
  onDeleteTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  fields: FieldVisibility;
  onAddTask: (status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <CollapsibleTrigger
        className={cn(
          "flex items-center gap-1.5 py-1.5 text-sm font-medium",
          "text-muted-foreground hover:text-foreground transition-colors",
        )}
      >
        <ChevronDown className="size-3.5 transition-transform group-data-[state=closed]/collapsible:-rotate-90" />
        {STATUS_LABEL[status]}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="bg-muted/30 overflow-hidden rounded-lg border">
          <ul className="divide-y md:hidden">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="hover:bg-muted/40 flex flex-col gap-2 px-4 py-3 transition-colors"
                >
                  <span className="text-sm font-medium">{task.title}</span>

                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {fields.priority && (
                      <PriorityBadge priority={task.priority} />
                    )}
                    {fields.status && (
                      <span className="text-muted-foreground text-xs">
                        {STATUS_LABEL[task.status]}
                      </span>
                    )}
                    {fields.dueDate && task.dueDate && (
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {formatDueDate(task.dueDate)}
                      </span>
                    )}
                    {fields.members && task.assignees.length > 0 && (
                      <MemberAvatars members={task.assignees} />
                    )}
                  </span>

                  {fields.labels && task.labels.length > 0 && (
                    <LabelChips labels={task.labels} max={3} />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="min-w-56">Task</TableHead>
                  {fields.priority && <TableHead className="w-28">Priority</TableHead>}
                  {fields.status && <TableHead className="w-28">Status</TableHead>}
                  {fields.members && <TableHead className="w-28">Members</TableHead>}
                  {fields.labels && <TableHead className="min-w-40">Labels</TableHead>}
                  {fields.reporter && <TableHead className="w-32">Reporter</TableHead>}
                  {fields.dueDate && <TableHead className="w-32">Due Date</TableHead>}
                  <TableHead className="w-16 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="font-medium hover:underline"
                      >
                        {task.title}
                      </Link>
                    </TableCell>

                    {fields.priority && (
                      <TableCell>
                        <PriorityBadge priority={task.priority} />
                      </TableCell>
                    )}

                    {fields.status && (
                      <TableCell className="text-muted-foreground">
                        {STATUS_LABEL[task.status]}
                      </TableCell>
                    )}

                    {fields.members && (
                      <TableCell>
                        <MemberAvatars members={task.assignees} />
                      </TableCell>
                    )}

                    {fields.labels && (
                      <TableCell>
                        <LabelChips labels={task.labels} max={2} />
                      </TableCell>
                    )}

                    {fields.reporter && (
                      <TableCell className="text-muted-foreground">
                        {task.reporter?.name ?? "—"}
                      </TableCell>
                    )}

                    {fields.dueDate && (
                      <TableCell className="text-muted-foreground tabular-nums">
                        {task.dueDate ? formatDueDate(task.dueDate) : "—"}
                      </TableCell>
                    )}

                    <TableCell className="text-right">
                      <RowActionsMenu
                        editHref={`/tasks/${task.id}`}
                        label={task.title}
                        onDelete={() => onDeleteTask(task.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <button
            type="button"
            onClick={() => onAddTask(status)}
            className={cn(
              "flex w-full items-center gap-1.5 border-t px-4 py-2 text-sm",
              "text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors",
            )}
          >
            <Plus className="size-3.5" />
            Add Task
          </button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
