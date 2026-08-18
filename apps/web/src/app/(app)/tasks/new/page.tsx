"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  Lock,
  MoreHorizontal,
  PanelRight,
  Plus,
  Settings2,
  Share2,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import {
  DateChip,
  MembersPicker,
  PriorityPicker,
  ProjectPicker,
  StatusPicker,
} from "@/components/task-fields";
import { Button } from "@/components/ui/button";
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  isPriority,
  isTaskStatus,
  type Label as TaskLabel,
  type Priority,
  type Project,
  type Task,
  type TaskStatus,
  type User,
} from "@/lib/types";

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

type SubtaskDraft = {
  title: string;
  priority: Priority;
  assigneeIds: string[];
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

  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([]);
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

  const chosenLabels = useMemo(
    () => labels.filter((label) => draft.labelIds.includes(label.id)),
    [labels, draft.labelIds],
  );

  const fromProject = projectParam
    ? (projects.find((item) => item.id === projectParam) ?? null)
    : null;

  const originHref = projectParam ? `/projects/${projectParam}` : "/tasks";
  const originLabel = projectParam ? (fromProject?.name ?? "Project") : "Tasks";

  const returnHref = projectParam
    ? `/projects/${draft.projectId ?? projectParam}`
    : "/tasks";

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

  function updateSubtask(index: number, patch: Partial<SubtaskDraft>) {
    setSubtasks((current) =>
      current.map((subtask, position) =>
        position === index ? { ...subtask, ...patch } : subtask,
      ),
    );
  }

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

      for (const subtask of subtasks) {
        await api<Task>("/tasks", {
          method: "POST",
          body: JSON.stringify({
            title: subtask.title,
            priority: subtask.priority,
            assigneeIds: subtask.assigneeIds,
            dueDate: subtask.dueDate ?? undefined,
            parentId: created.id,
          }),
        });
      }

      router.push(returnHref);
    } catch (error) {
      setSaving(false);
      toast.error(
        error instanceof Error ? error.message : "Could not create the task",
      );
    }
  }

  return (
    <>
      <AppHeader
        crumbs={[{ label: originLabel, href: originHref }, { label: "New Task" }]}
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push(originHref)}
          >
            <ArrowLeft className="size-4" />
            Back to {originLabel}
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
                {subtasks.map((subtask, index) => (
                  <div
                    key={`${subtask.title}-${index}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
                  >
                    <Checkbox disabled aria-label={subtask.title} />
                    <span className="min-w-32 flex-1 text-sm">{subtask.title}</span>

                    <PriorityPicker
                      priority={subtask.priority}
                      align="start"
                      onSelect={(priority) =>
                        updateSubtask(index, { priority })
                      }
                    />

                    <MembersPicker
                      members={members}
                      selected={subtask.assigneeIds}
                      onToggle={(id) =>
                        updateSubtask(index, {
                          assigneeIds: subtask.assigneeIds.includes(id)
                            ? subtask.assigneeIds.filter((value) => value !== id)
                            : [...subtask.assigneeIds, id],
                        })
                      }
                      compact
                    />

                    <DateChip
                      value={subtask.dueDate}
                      placeholder="Due date"
                      onSelect={(dueDate) => updateSubtask(index, { dueDate })}
                    />

                    <button
                      type="button"
                      aria-label={`Remove ${subtask.title}`}
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
                    setSubtasks((current) => [
                      ...current,
                      {
                        title: value,
                        priority: "NO_PRIORITY",
                        assigneeIds: [],
                        dueDate: null,
                      },
                    ]);
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
                  <StatusPicker
                    status={draft.status}
                    onSelect={(status) => update("status", status)}
                  />
                </DetailRow>

                <DetailRow label="Project">
                  <ProjectPicker
                    projects={projects}
                    project={project}
                    onSelect={(id) => update("projectId", id)}
                    align="end"
                    plain
                  />
                </DetailRow>

                <DetailRow label="Priority">
                  <PriorityPicker
                    priority={draft.priority}
                    onSelect={(priority) => update("priority", priority)}
                  />
                </DetailRow>

                <DetailRow label="Members">
                  <MembersPicker
                    members={members}
                    selected={draft.assigneeIds}
                    onToggle={(id) => toggleIn("assigneeIds", id)}
                    align="end"
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
