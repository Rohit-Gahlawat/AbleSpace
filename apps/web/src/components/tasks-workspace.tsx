"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { FieldsMenu } from "@/components/fields-menu";
import {
  countActiveFilters,
  EMPTY_FILTERS,
  FilterMenu,
  type DueRange,
  type TaskFilters,
} from "@/components/filter-menu";
import { TaskBoard } from "@/components/task-board";
import { TaskList } from "@/components/task-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTaskView } from "@/hooks/use-task-view";
import { api } from "@/lib/api";
import type { Label as TaskLabel, Task, TaskStatus, User } from "@/lib/types";

export function TasksWorkspace({
  title,
  projectId,
}: {
  title: string;
  projectId?: string;
}) {
  const router = useRouter();
  const { view, setView, fields, toggleField } = useTaskView();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const search = projectId ? `?projectId=${projectId}` : "";
        const [taskList, memberList, labelList] = await Promise.all([
          api<Task[]>(`/tasks${search}`),
          api<User[]>("/members"),
          api<TaskLabel[]>("/labels"),
        ]);
        if (cancelled) return;
        setTasks(taskList);
        setMembers(memberList);
        setLabels(labelList);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load tasks",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setSearchOpen(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      }
      if (event.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setQuery("");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  const visibleTasks = useMemo(() => {
    const term = query.trim().toLowerCase();

    return tasks.filter((task) => {
      if (term && !task.title.toLowerCase().includes(term)) return false;
      if (filters.status.length && !filters.status.includes(task.status)) {
        return false;
      }
      if (filters.priority.length && !filters.priority.includes(task.priority)) {
        return false;
      }
      if (
        filters.assigneeIds.length &&
        !task.assignees.some((member) => filters.assigneeIds.includes(member.id))
      ) {
        return false;
      }
      if (
        filters.labelIds.length &&
        !task.labels.some((label) => filters.labelIds.includes(label.id))
      ) {
        return false;
      }
      if (
        filters.reporterIds.length &&
        !(task.reporter && filters.reporterIds.includes(task.reporter.id))
      ) {
        return false;
      }
      if (filters.due.length && !matchesDueRange(task.dueDate, filters.due)) {
        return false;
      }
      return true;
    });
  }, [tasks, query, filters]);

  const addTask = useCallback(
    (status?: TaskStatus) => {
      const search = new URLSearchParams();
      if (status) search.set("status", status);
      if (projectId) search.set("projectId", projectId);
      const query = search.toString();
      router.push(query ? `/tasks/new?${query}` : "/tasks/new");
    },
    [projectId, router],
  );

  const moveTask = useCallback(
    async (taskId: string, status: TaskStatus, position: number) => {
      const previous = tasks;
      const moved = tasks.find((task) => task.id === taskId);
      if (!moved) return;

      const column = tasks
        .filter((task) => task.status === status && task.id !== taskId)
        .sort((a, b) => a.position - b.position);

      column.splice(position, 0, { ...moved, status });

      const repositioned = column.map((task, index) => ({ ...task, position: index }));
      const byId = new Map(repositioned.map((task) => [task.id, task]));

      setTasks((current) =>
        current.map((task) => byId.get(task.id) ?? task),
      );

      try {
        await api<Task>(`/tasks/${taskId}/move`, {
          method: "PATCH",
          body: JSON.stringify({ status, position }),
        });
      } catch (error) {
        setTasks(previous);
        toast.error(
          error instanceof Error ? error.message : "Could not move the task",
        );
      }
    },
    [tasks],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const previous = tasks;
      setTasks((current) => current.filter((task) => task.id !== taskId));

      try {
        await api(`/tasks/${taskId}`, { method: "DELETE" });
        toast.success("Task deleted");
      } catch (error) {
        setTasks(previous);
        toast.error(
          error instanceof Error ? error.message : "Could not delete the task",
        );
      }
    },
    [tasks],
  );

  const filtered = countActiveFilters(filters) + query.trim().length > 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {searchOpen ? (
            <div className="relative w-56 sm:w-72">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks..."
                className="h-8 pr-16 pl-8"
                autoFocus
              />
              <kbd className="text-muted-foreground bg-muted absolute top-1/2 right-8 -translate-y-1/2 rounded px-1.5 py-0.5 text-[0.625rem] font-medium">
                ⌘F
              </kbd>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                aria-label="Close search"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Search tasks"
              onClick={() => {
                setSearchOpen(true);
                requestAnimationFrame(() => searchRef.current?.focus());
              }}
            >
              <Search />
            </Button>
          )}

          <FieldsMenu
            view={view}
            onViewChange={setView}
            fields={fields}
            onToggleField={toggleField}
          />

          <FilterMenu
            filters={filters}
            onChange={setFilters}
            members={members}
            labels={labels}
          />

          <Button size="sm" onClick={() => addTask()}>
            <Plus />
            Add Task
          </Button>
        </div>
      </div>

      {loading ? (
        <TasksSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState onAddTask={() => addTask()} />
      ) : visibleTasks.length === 0 && filtered ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          No tasks match your search or filters.
        </p>
      ) : view === "list" ? (
        <TaskList
          tasks={visibleTasks}
          fields={fields}
          onAddTask={(status) => addTask(status)}
          onDeleteTask={(taskId) => void deleteTask(taskId)}
        />
      ) : (
        <TaskBoard
          tasks={visibleTasks}
          fields={fields}
          onAddTask={(status) => addTask(status)}
          onMoveTask={(taskId, status, position) => void moveTask(taskId, status, position)}
          onDeleteTask={(taskId) => void deleteTask(taskId)}
        />
      )}
    </div>
  );
}


function matchesDueRange(dueDate: string | null, ranges: DueRange[]) {
  if (!dueDate) return ranges.includes("none");

  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return ranges.some((range) => {
    if (range === "overdue") return due < today;
    if (range === "today") return due.toDateString() === today.toDateString();
    if (range === "week") return due >= today && due <= endOfWeek;
    return false;
  });
}

function TasksSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}

function EmptyState({ onAddTask }: { onAddTask: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm font-medium">No tasks yet</p>
      <p className="text-muted-foreground max-w-sm text-sm">
        Create your first task to start tracking work across the board.
      </p>
      <Button size="sm" onClick={onAddTask}>
        <Plus />
        Add Task
      </Button>
    </div>
  );
}
