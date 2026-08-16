"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Eye,
  Lock,
  MoreHorizontal,
  PanelRight,
  Settings2,
  Share2,
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
import {
  DropdownMenu,
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
  type Priority,
  type Project,
  type User,
} from "@/lib/types";

export default function NewProjectPage() {
  const router = useRouter();

  const [members, setMembers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("NO_PRIORITY");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = await api<User[]>("/members");
        if (!cancelled) setMembers(list);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load members",
          );
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const lead = useMemo(
    () => members.find((member) => member.id === leadId) ?? null,
    [members, leadId],
  );

  const createProject = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Give the project a name first");
      return;
    }

    setSaving(true);
    try {
      await api<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          priority,
          leadId: leadId ?? undefined,
          dueDate: dueDate ?? undefined,
        }),
      });
      router.push("/projects");
    } catch (error) {
      setSaving(false);
      toast.error(
        error instanceof Error ? error.message : "Could not create the project",
      );
    }
  }, [name, description, priority, leadId, dueDate, router]);

  return (
    <>
      <AppHeader
        crumbs={[{ label: "Projects", href: "/projects" }, { label: "New Project" }]}
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => router.push("/projects")}
          >
            <ArrowLeft className="size-4" />
            Back to Projects
          </Button>

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon-sm" aria-label="Lock project" disabled>
              <Lock />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Viewers" disabled>
              <Eye />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Share project" disabled>
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
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Project name"
                aria-label="Project name"
                className={cn(
                  "h-auto border-0 px-1 py-1 text-3xl font-semibold tracking-tight shadow-none",
                  "placeholder:text-muted-foreground/50 placeholder:font-normal",
                  "focus-visible:ring-0",
                )}
                autoFocus
              />
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add a description..."
                aria-label="Project description"
                className={cn(
                  "min-h-12 resize-none border-0 px-1 py-1 text-base shadow-none",
                  "placeholder:text-muted-foreground/50 placeholder:font-normal",
                  "focus-visible:ring-0",
                )}
              />
            </div>
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
                <DetailRow label="Priority">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="hover:bg-accent flex items-center gap-1.5 rounded-sm px-1.5 py-0.5"
                      >
                        <PriorityIcon priority={priority} />
                        {PRIORITY_LABEL[priority]}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel>Priority</DropdownMenuLabel>
                      {PRIORITIES.map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onSelect={() => setPriority(option)}
                        >
                          <PriorityIcon priority={option} />
                          {PRIORITY_LABEL[option]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DetailRow>

                <DetailRow label="Lead">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="hover:bg-accent flex items-center gap-1.5 rounded-sm px-1.5 py-0.5"
                      >
                        {lead ? (
                          <>
                            <UserAvatar user={lead} className="size-4" />
                            {lead.name}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Add lead</span>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel>Lead</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => setLeadId(null)}>
                        No lead
                      </DropdownMenuItem>
                      {members.map((member) => (
                        <DropdownMenuItem
                          key={member.id}
                          onSelect={() => setLeadId(member.id)}
                        >
                          <span className="flex items-center gap-2">
                            <UserAvatar user={member} className="size-4" />
                            {member.name}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DetailRow>

                <DetailRow label="Due Date">
                  <div className="flex items-center gap-1.5 px-1.5">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="hover:bg-accent flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-xs"
                        >
                          <CalendarDays className="size-3" />
                          {dueDate ? formatDueDate(dueDate) : "Set date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dueDate ? new Date(dueDate) : undefined}
                          onSelect={(date) =>
                            setDueDate(date ? date.toISOString() : null)
                          }
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {dueDate && (
                      <button
                        type="button"
                        aria-label="Clear due date"
                        onClick={() => setDueDate(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                </DetailRow>
              </dl>
              </CollapsibleContent>
            </Collapsible>

            <Button
              className="w-full"
              size="lg"
              onClick={() => void createProject()}
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </div>
      </div>
    </>
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
