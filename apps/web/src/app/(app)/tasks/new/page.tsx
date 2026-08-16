"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Eye,
  FolderOpen,
  Lock,
  MoreHorizontal,
  PanelRight,
  Plus,
  Settings2,
  Share2,
  Tag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { PriorityIcon } from "@/components/priority-badge";
import { formatDueDate } from "@/components/task-meta";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TASK_STATUSES,
  isPriority,
  isTaskStatus,
  type Label as TaskLabel,
  type Priority,
  type Project,
  type Task,
  type TaskStatus,
  type User,
} from "@/lib/types";

const STATUS_DOT: Record<TaskStatus, string> = {
  BACKLOG: "bg-status-backlog",
  TODO: "bg-status-todo",
  DOING: "bg-status-in-progress",
  COMPLETED: "bg-status-done",
  ON_HOLD: "bg-status-cancelled",
};

type Draft = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string | null;
  assigneeIds: string[];
  labelIds: string[];
  startDate: string | null;
  dueDate: string | null;
};

export default function NewTaskPage() {
  const router = useRouter();
  const params = useSearchParams();

  const statusParam = params.get("status");
  const projectParam = params.get("projectId");

  const [members, setMembers] = useState<User[]>([]);
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);

  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState("");

  const [draft, setDraft] = useState<Draft>({
    title: "",
    description: "",
    status: isTaskStatus(statusParam) ? statusParam : "BACKLOG",
    priority: isPriority(params.get("priority"))
      ? (params.get("priority") as Priority)
      : "NO_PRIORITY",
    projectId: projectParam,
    assigneeIds: [],
    labelIds: [],
    startDate: null,
    dueDate: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [memberList, labelList, projectList] = await Promise.all([
          api<User[]>("/members"),
          api<TaskLabel[]>("/labels"),
          api<Project[]>("/projects"),
        ]);
        if (cancelled) return;
        setMembers(memberList);
        setLabels(labelList);
        setProjects(projectList);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load options",
          );
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const project = useMemo(
    () => projects.find((item) => item.id === draft.projectId) ?? null,
    [projects, draft.projectId],
  );

  const chosenMembers = useMemo(
    () => members.filter((member) => draft.assigneeIds.includes(member.id)),
    [members, draft.assigneeIds],
  );

  const chosenLabels = useMemo(
    () => labels.filter((label) => draft.labelIds.includes(label.id)),
    [labels, draft.labelIds],
  );

  const update = useCallback(
    <K extends keyof Draft>(key: K, value: Draft[K]) =>
      setDraft((current) => ({ ...current, [key]: value })),
    [],
  );

  const toggleIn = useCallback(
    (key: "assigneeIds" | "labelIds", id: string) =>
      setDraft((current) => ({
        ...current,
        [key]: current[key].includes(id)
          ? current[key].filter((value) => value !== id)
          : [...current[key], id],
      })),
    [],
  );

  async function createTask() {
    if (!draft.title.trim()) {
      toast.error("Give the task a title first");
      return;
    }

    setSaving(true);
    try {
      const created = await api<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: draft.title.trim(),
          description: draft.description.trim() || undefined,
          status: draft.status,
          priority: draft.priority,
          projectId: draft.projectId ?? undefined,
          assigneeIds: draft.assigneeIds,
          labelIds: draft.labelIds,
          startDate: draft.startDate ?? undefined,
          dueDate: draft.dueDate ?? undefined,
        }),
      });

      for (const title of subtasks) {
        await api<Task>("/tasks", {
          method: "POST",
          body: JSON.stringify({ title, parentId: created.id }),
        });
      }

      router.push("/tasks");
    } catch (error) {
      setSaving(false);
      toast.error(
        error instanceof Error ? error.message : "Could not create the task",
      );
    }
  }

  return (
    <>
      <AppHeader crumbs={[{ label: "Tasks", href: "/tasks" }, { label: "New Task" }]} />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/tasks")}
          >
            <ArrowLeft className="size-4" />
            Back to Tasks
          </Button>

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon-sm" aria-label="Lock task" disabled>
              <Lock />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Viewers" disabled>
              <Eye />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Share task" disabled>
              <Share2 />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="More actions" disabled>
              <MoreHorizontal />
            </Button>
            <Button variant="default" size="icon-sm" aria-label="Toggle details panel">
              <PanelRight />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="-ml-1 flex flex-col gap-3">
              <Input
                value={draft.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Task title"
                aria-label="Task title"
                className={cn(
                  "h-auto border-0 px-1 py-1 text-3xl font-semibold tracking-tight shadow-none",
                  "placeholder:text-muted-foreground/50 placeholder:font-normal",
                  "focus-visible:ring-0",
                )}
                autoFocus
              />
              <Textarea
                value={draft.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Add a description..."
                aria-label="Task description"
                className={cn(
                  "min-h-12 resize-none border-0 px-1 py-1 text-base shadow-none",
                  "placeholder:text-muted-foreground/50 placeholder:font-normal",
                  "focus-visible:ring-0",
                )}
              />
            </div>

            <dl className="flex flex-col gap-4 text-sm">
              <PropertyRow label="Properties">
                <div className="flex flex-wrap items-center gap-2">
                  <MembersPicker
                    members={members}
                    selected={draft.assigneeIds}
                    onToggle={(id) => toggleIn("assigneeIds", id)}
                    chosen={chosenMembers}
                  />
                  <DateChip
                    value={draft.dueDate}
                    placeholder="Due date"
                    tone="destructive"
                    onSelect={(date) => update("dueDate", date)}
                  />
                  <ProjectPicker
                    projects={projects}
                    project={project}
                    onSelect={(id) => update("projectId", id)}
                  />
                </div>
              </PropertyRow>

              <PropertyRow label="Labels">
                <div className="flex flex-wrap items-center gap-2">
                  {chosenLabels.map((label) => (
                    <span
                      key={label.id}
                      className="bg-muted inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium"
                    >
                      <Tag className="size-3" />
                      {label.name}
                      <button
                        type="button"
                        aria-label={`Remove ${label.name}`}
                        onClick={() => toggleIn("labelIds", label.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground rounded-md border border-dashed px-2 py-0.5 text-xs"
                      >
                        Add label...
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52">
                      <DropdownMenuLabel>Labels</DropdownMenuLabel>
                      {labels.map((label) => (
                        <DropdownMenuCheckboxItem
                          key={label.id}
                          checked={draft.labelIds.includes(label.id)}
                          onCheckedChange={() => toggleIn("labelIds", label.id)}
                          onSelect={(event) => event.preventDefault()}
                        >
                          {label.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </PropertyRow>
            </dl>

            <Collapsible defaultOpen className="group/subtasks flex flex-col gap-2">
              <CollapsibleTrigger className="flex w-fit items-center gap-1.5 text-sm font-medium">
                <ChevronDown className="size-3.5 transition-transform group-data-[state=closed]/subtasks:-rotate-90" />
                Subtasks
                <span className="text-muted-foreground font-normal">
                  0/{subtasks.length} done
                </span>
              </CollapsibleTrigger>

              <CollapsibleContent className="flex flex-col gap-2">
                {subtasks.map((title, index) => (
                  <div
                    key={`${title}-${index}`}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2"
                  >
                    <Checkbox disabled aria-label={title} />
                    <span className="flex-1 text-sm">{title}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${title}`}
                      onClick={() =>
                        setSubtasks((current) =>
                          current.filter((_, position) => position !== index),
                        )
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}

                <form
                  className="flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const value = subtaskDraft.trim();
                    if (!value) return;
                    setSubtasks((current) => [...current, value]);
                    setSubtaskDraft("");
                  }}
                >
                  <Input
                    value={subtaskDraft}
                    onChange={(event) => setSubtaskDraft(event.target.value)}
                    placeholder="Add a subtask..."
                    className="h-9"
                  />
                  <Button type="submit" size="icon-sm" aria-label="Add subtask">
                    <Plus />
                  </Button>
                </form>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="flex w-full flex-col gap-4 lg:w-80">
            <Collapsible defaultOpen className="group/details rounded-lg border">
              <header className="flex items-center justify-between border-b px-3 py-2">
                <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-medium">
                  <ChevronDown className="size-3.5 transition-transform group-data-[state=closed]/details:-rotate-90" />
                  Details
                </CollapsibleTrigger>
                <Button variant="ghost" size="icon-sm" aria-label="Configure fields">
                  <Settings2 />
                </Button>
              </header>

              <CollapsibleContent>
              <dl className="flex flex-col gap-0.5 p-2 text-sm">
                <DetailRow label="Status">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="hover:bg-accent flex items-center gap-1.5 rounded-sm px-1.5 py-0.5"
                      >
                        <span
                          className={cn("size-2 rounded-full", STATUS_DOT[draft.status])}
                        />
                        {STATUS_LABEL[draft.status]}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel>Status</DropdownMenuLabel>
                      {TASK_STATUSES.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onSelect={() => update("status", status)}
                        >
                          <span
                            className={cn("size-2 rounded-full", STATUS_DOT[status])}
                          />
                          {STATUS_LABEL[status]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DetailRow>

                <DetailRow label="Project">
                  <ProjectPicker
                    projects={projects}
                    project={project}
                    onSelect={(id) => update("projectId", id)}
                    plain
                  />
                </DetailRow>

                <DetailRow label="Priority">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="hover:bg-accent flex items-center gap-1.5 rounded-sm px-1.5 py-0.5"
                      >
                        <PriorityIcon priority={draft.priority} />
                        {PRIORITY_LABEL[draft.priority]}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel>Priority</DropdownMenuLabel>
                      {PRIORITIES.map((priority) => (
                        <DropdownMenuItem
                          key={priority}
                          onSelect={() => update("priority", priority)}
                        >
                          <PriorityIcon priority={priority} />
                          {PRIORITY_LABEL[priority]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DetailRow>

                <DetailRow label="Members">
                  <MembersPicker
                    members={members}
                    selected={draft.assigneeIds}
                    onToggle={(id) => toggleIn("assigneeIds", id)}
                    chosen={chosenMembers}
                    plain
                  />
                </DetailRow>

                <DetailRow label="Dates">
                  <div className="flex items-center gap-1.5 px-1.5">
                    <DateChip
                      value={draft.dueDate}
                      placeholder="Set date"
                      onSelect={(date) => update("dueDate", date)}
                    />
                    {draft.dueDate && (
                      <button
                        type="button"
                        aria-label="Clear due date"
                        onClick={() => update("dueDate", null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                </DetailRow>

                <DetailRow label="Teams">
                  <span className="text-muted-foreground px-1.5">Add team</span>
                </DetailRow>
              </dl>
              </CollapsibleContent>
            </Collapsible>

            <Button
              className="w-full"
              size="lg"
              onClick={() => void createTask()}
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Task"}
            </Button>
          </div>
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
    <div className="flex items-start gap-8">
      <dt className="text-muted-foreground w-24 shrink-0 pt-1 text-sm">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-1.5 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center">{children}</dd>
    </div>
  );
}

function DateChip({
  value,
  placeholder,
  tone,
  onSelect,
}: {
  value: string | null;
  placeholder: string;
  tone?: "destructive";
  onSelect: (date: string | null) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-xs",
            "hover:bg-accent",
            tone === "destructive" &&
              value &&
              "bg-destructive/10 text-destructive border-transparent",
          )}
        >
          <CalendarDays className="size-3" />
          {value ? formatDueDate(value) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => onSelect(date ? date.toISOString() : null)}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function MembersPicker({
  members,
  selected,
  chosen,
  onToggle,
  plain,
}: {
  members: User[];
  selected: string[];
  chosen: User[];
  onToggle: (id: string) => void;
  plain?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 text-xs",
            plain
              ? "hover:bg-accent rounded-sm px-1.5 py-0.5"
              : "rounded-md border px-1.5 py-0.5",
          )}
        >
          {chosen.length > 0 ? (
            <>
              <UserAvatar user={chosen[0]} className="size-4" />
              <span className="font-medium">
                {chosen.length > 1 ? `${chosen.length} members` : chosen[0].name}
              </span>
            </>
          ) : (
            <>
              <UserRound className="size-3" />
              Add members
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>Members</DropdownMenuLabel>
        {members.map((member) => (
          <DropdownMenuCheckboxItem
            key={member.id}
            checked={selected.includes(member.id)}
            onCheckedChange={() => onToggle(member.id)}
            onSelect={(event) => event.preventDefault()}
          >
            <span className="flex items-center gap-2">
              <UserAvatar user={member} className="size-4" />
              {member.name}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectPicker({
  projects,
  project,
  onSelect,
  plain,
}: {
  projects: Project[];
  project: Project | null;
  onSelect: (id: string | null) => void;
  plain?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 text-xs",
            plain
              ? "hover:bg-accent rounded-sm px-1.5 py-0.5"
              : "rounded-md border px-1.5 py-0.5",
            !plain && project && "bg-muted border-transparent font-medium",
          )}
        >
          <FolderOpen className="size-3" />
          {project ? project.name : "Add project"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Project</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onSelect(null)}>No project</DropdownMenuItem>
        {projects.map((item) => (
          <DropdownMenuItem key={item.id} onSelect={() => onSelect(item.id)}>
            {item.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
