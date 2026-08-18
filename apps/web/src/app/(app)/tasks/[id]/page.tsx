"use client";

import { use, useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import {
  ChevronDown,
  Eye,
  Lock,
  MoreHorizontal,
  PanelRight,
  Paperclip,
  Plus,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { TaskComments } from "@/components/task-comments";
import { TaskDetailsPanel } from "@/components/task-details-panel";
import { DateChip, MembersPicker, PriorityPicker } from "@/components/task-fields";
import { DueDateChip, LabelChips, MemberAvatars } from "@/components/task-meta";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ApiError, api } from "@/lib/api";
import type {
  Activity,
  Comment,
  Priority,
  Project,
  Task,
  TaskStatus,
  User,
} from "@/lib/types";

type TaskDetail = Task & {
  subtasks: Task[];
  comments: Comment[];
  activity: Activity[];
};

type TaskPatch = {
  status?: TaskStatus;
  priority?: Priority;
  startDate?: string | null;
  dueDate?: string | null;
  assigneeIds?: string[];
  projectId?: string | null;
};

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [found, memberList, projectList] = await Promise.all([
          api<TaskDetail>(`/tasks/${id}`),
          api<User[]>("/members"),
          api<Project[]>("/projects"),
        ]);
        if (cancelled) return;
        setTask(found);
        setMembers(memberList);
        setProjects(projectList);
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
    async (body: TaskPatch) => {
      if (!task) return;
      const previous = task;
      setTask({ ...task, ...body });

      try {
        await api<Task>(`/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
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

  const toggleMember = useCallback(
    (userId: string) => {
      if (!task) return;
      const current = task.assignees.map((member) => member.id);
      void patch({
        assigneeIds: current.includes(userId)
          ? current.filter((value) => value !== userId)
          : [...current, userId],
      });
    },
    [task, patch],
  );

  const addSubtask = useCallback(
    async (title: string) => {
      if (!task) return;

      try {
        await api<Task>("/tasks", {
          method: "POST",
          body: JSON.stringify({ title, parentId: task.id }),
        });
        const refreshed = await api<TaskDetail>(`/tasks/${task.id}`);
        setTask(refreshed);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not add the subtask",
        );
      }
    },
    [task],
  );

  const patchSubtask = useCallback(
    async (subtaskId: string, body: TaskPatch) => {
      if (!task) return;
      const previous = task;

      setTask({
        ...task,
        subtasks: task.subtasks.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, ...body } : subtask,
        ),
      });

      try {
        await api<Task>(`/tasks/${subtaskId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        const refreshed = await api<TaskDetail>(`/tasks/${task.id}`);
        setTask(refreshed);
      } catch (error) {
        setTask(previous);
        toast.error(
          error instanceof Error ? error.message : "Could not update the subtask",
        );
      }
    },
    [task],
  );

  const deleteSubtask = useCallback(
    async (subtaskId: string) => {
      if (!task) return;
      const previous = task;

      setTask({
        ...task,
        subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
      });

      try {
        await api(`/tasks/${subtaskId}`, { method: "DELETE" });
      } catch (error) {
        setTask(previous);
        toast.error(
          error instanceof Error ? error.message : "Could not delete the subtask",
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

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-end gap-1.5">
          <Button variant="outline" size="icon-sm" aria-label="Lock task">
            <Lock />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-blue-600 dark:text-blue-400"
            aria-label="Viewers"
          >
            <Eye />
            <span className="tabular-nums">1</span>
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Share task">
            <Share2 />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="More actions">
            <MoreHorizontal />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Toggle details panel"
          >
            <PanelRight />
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
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

          <dl className="flex flex-col gap-4 text-sm">
            <PropertyRow label="Properties">
              <div className="flex flex-wrap items-center gap-2">
                {task.assignees.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <MemberAvatars members={task.assignees} max={3} />
                    {task.assignees.length === 1 && (
                      <span className="text-xs font-medium">
                        {task.assignees[0].name}
                      </span>
                    )}
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
                <Paperclip className="size-3" />
                Add document or link...
              </button>
            </PropertyRow>
          </dl>

          <Collapsible defaultOpen className="group/subtasks flex flex-col gap-2">
            <CollapsibleTrigger className="flex w-fit items-center gap-1.5 text-sm font-medium">
              <ChevronDown className="size-3.5 transition-transform group-data-[state=closed]/subtasks:-rotate-90" />
              Subtasks
            </CollapsibleTrigger>
            <CollapsibleContent>
            <div className="overflow-hidden rounded-lg border">
              <ul className="divide-y md:hidden">
                {task.subtasks.map((subtask) => (
                  <li
                    key={subtask.id}
                    className="flex flex-col gap-2 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">{subtask.title}</span>
                      <RowActionsMenu
                        editHref={`/tasks/${subtask.id}`}
                        label={subtask.title}
                        onDelete={() => void deleteSubtask(subtask.id)}
                        className="-mt-1 -mr-1"
                      />
                    </div>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <PriorityPicker
                        priority={subtask.priority}
                        align="start"
                        onSelect={(priority) =>
                          void patchSubtask(subtask.id, { priority })
                        }
                      />
                      <DateChip
                        value={subtask.dueDate}
                        placeholder="Due date"
                        onSelect={(dueDate) =>
                          void patchSubtask(subtask.id, { dueDate })
                        }
                      />
                      <MembersPicker
                        members={members}
                        selected={subtask.assignees.map((member) => member.id)}
                        onToggle={(userId) =>
                          void patchSubtask(subtask.id, {
                            assigneeIds: toggleId(
                              subtask.assignees.map((member) => member.id),
                              userId,
                            ),
                          })
                        }
                        compact
                      />
                    </span>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
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
                          <PriorityPicker
                            priority={subtask.priority}
                            align="start"
                            onSelect={(priority) =>
                              void patchSubtask(subtask.id, { priority })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <MembersPicker
                            members={members}
                            selected={subtask.assignees.map((member) => member.id)}
                            onToggle={(userId) =>
                              void patchSubtask(subtask.id, {
                                assigneeIds: toggleId(
                                  subtask.assignees.map((member) => member.id),
                                  userId,
                                ),
                              })
                            }
                            compact
                          />
                        </TableCell>
                        <TableCell>
                          <DateChip
                            value={subtask.dueDate}
                            placeholder="—"
                            onSelect={(dueDate) =>
                              void patchSubtask(subtask.id, { dueDate })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <RowActionsMenu
                            editHref={`/tasks/${subtask.id}`}
                            label={subtask.title}
                            onDelete={() => void deleteSubtask(subtask.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <AddSubtaskRow onAdd={(title) => void addSubtask(title)} />
            </div>
            </CollapsibleContent>
          </Collapsible>

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
          members={members}
          projects={projects}
          onChangeStatus={(status) => void patch({ status })}
          onChangePriority={(priority) => void patch({ priority })}
          onChangeDates={(dates) => void patch(dates)}
          onToggleMember={toggleMember}
          onChangeProject={(projectId) => void patch({ projectId })}
        />
        </div>
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
    <div className="flex items-center gap-8">
      <dt className="text-muted-foreground w-24 shrink-0 text-sm">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function AddSubtaskRow({ onAdd }: { onAdd: (title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-1.5 border-t px-4 py-2 text-sm",
          "text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors",
        )}
      >
        <Plus className="size-3.5" />
        Add Subtasks
      </button>
    );
  }

  return (
    <form
      className="flex items-center gap-2 border-t px-4 py-2"
      onSubmit={(event) => {
        event.preventDefault();
        const value = title.trim();
        if (!value) return;
        onAdd(value);
        setTitle("");
      }}
    >
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setTitle("");
            setOpen(false);
          }
        }}
        placeholder="Subtask title"
        aria-label="Subtask title"
        className="h-8"
        autoFocus
      />
      <Button type="submit" size="sm" disabled={!title.trim()}>
        Add
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setTitle("");
          setOpen(false);
        }}
      >
        Cancel
      </Button>
    </form>
  );
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((value) => value !== id) : [...list, id];
}
