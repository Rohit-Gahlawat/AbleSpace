"use client";

import { use, useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import {
  Eye,
  Lock,
  MoreHorizontal,
  PanelRight,
  Plus,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { PriorityBadge } from "@/components/priority-badge";
import { TaskComments } from "@/components/task-comments";
import { TaskDetailsPanel } from "@/components/task-details-panel";
import { DueDateChip, LabelChips, MemberAvatars } from "@/components/task-meta";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDueDate } from "@/components/task-meta";
import { cn } from "@/lib/utils";
import { ApiError, api } from "@/lib/api";
import type { Activity, Comment, Priority, Task, TaskStatus } from "@/lib/types";

type TaskDetail = Task & {
  subtasks: Task[];
  comments: Comment[];
  activity: Activity[];
};

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const found = await api<TaskDetail>(`/tasks/${id}`);
        if (!cancelled) setTask(found);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setMissing(true);
        } else {
          toast.error(
            error instanceof Error ? error.message : "Could not load the task",
          );
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const patch = useCallback(
    async (body: { status?: TaskStatus; priority?: Priority }) => {
      if (!task) return;
      const previous = task;
      setTask({ ...task, ...body });

      try {
        const updated = await api<TaskDetail>(`/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setTask((current) =>
          current ? { ...current, ...updated, activity: current.activity } : current,
        );
        const refreshed = await api<TaskDetail>(`/tasks/${task.id}`);
        setTask(refreshed);
      } catch (error) {
        setTask(previous);
        toast.error(
          error instanceof Error ? error.message : "Could not update the task",
        );
      }
    },
    [task],
  );

  if (missing) notFound();

  if (!task) {
    return (
      <>
        <AppHeader crumbs={[{ label: "Tasks", href: "/tasks" }, { label: "…" }]} />
        <div className="flex flex-1 gap-4 p-4">
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <Skeleton className="hidden h-72 w-80 rounded-lg lg:block" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        crumbs={[{ label: "Tasks", href: "/tasks" }, { label: task.title }]}
      />

      <div className="flex flex-1 flex-col gap-6 p-4 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <h1 className="text-xl font-semibold tracking-tight">
                {task.title}
              </h1>
              {task.description && (
                <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <Button variant="ghost" size="icon-sm" aria-label="Lock task">
                <Lock />
              </Button>
              <Button variant="ghost" size="sm" className="gap-1" aria-label="Viewers">
                <Eye />
                <span className="tabular-nums">1</span>
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Share task">
                <Share2 />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="More actions">
                <MoreHorizontal />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Toggle details panel">
                <PanelRight />
              </Button>
            </div>
          </div>

          <dl className="flex flex-col gap-2 text-sm">
            <PropertyRow label="Properties">
              <div className="flex flex-wrap items-center gap-2">
                {task.assignees[0] && (
                  <span className="flex items-center gap-1.5">
                    <UserAvatar user={task.assignees[0]} />
                    <span className="text-xs font-medium">
                      {task.assignees[0].name}
                    </span>
                  </span>
                )}
                {task.dueDate && <DueDateChip date={task.dueDate} />}
              </div>
            </PropertyRow>

            <PropertyRow label="Labels">
              {task.labels.length > 0 ? (
                <LabelChips labels={task.labels} />
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </PropertyRow>

            <PropertyRow label="Resources">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
              >
                <Plus className="size-3" />
                Add document or link...
              </button>
            </PropertyRow>
          </dl>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">Subtasks</h2>
            <div className="overflow-hidden rounded-lg border">
              <ul className="divide-y md:hidden">
                {task.subtasks.map((subtask) => (
                  <li
                    key={subtask.id}
                    className="flex flex-col gap-2 px-4 py-3"
                  >
                    <span className="text-sm font-medium">{subtask.title}</span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <PriorityBadge priority={subtask.priority} />
                      {subtask.dueDate && (
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {formatDueDate(subtask.dueDate)}
                        </span>
                      )}
                      <MemberAvatars members={subtask.assignees} />
                    </span>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="min-w-40">Task</TableHead>
                      <TableHead className="w-28">Priority</TableHead>
                      <TableHead className="w-24">Members</TableHead>
                      <TableHead className="w-32">Due Date</TableHead>
                      <TableHead className="w-16 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {task.subtasks.map((subtask) => (
                      <TableRow key={subtask.id}>
                        <TableCell className="font-medium">
                          {subtask.title}
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={subtask.priority} />
                        </TableCell>
                        <TableCell>
                          <MemberAvatars members={subtask.assignees} />
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {subtask.dueDate ? formatDueDate(subtask.dueDate) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${subtask.title}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-1.5 border-t px-4 py-2 text-sm",
                  "text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors",
                )}
              >
                <Plus className="size-3.5" />
                Add Subtasks
              </button>
            </div>
          </section>

          <TaskComments
            taskId={task.id}
            comments={task.comments}
            onChange={(comments) =>
              setTask((current) => (current ? { ...current, comments } : current))
            }
          />
        </div>

        <TaskDetailsPanel
          task={task}
          activity={task.activity}
          onChangeStatus={(status) => void patch({ status })}
          onChangePriority={(priority) => void patch({ priority })}
        />
      </div>
    </>
  );
}

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <dt className="text-muted-foreground w-24 shrink-0 text-xs">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
