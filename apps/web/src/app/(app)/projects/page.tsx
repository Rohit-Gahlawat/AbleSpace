"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Filter, MoreHorizontal, Plus, Search, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { PriorityBadge, PriorityIcon } from "@/components/priority-badge";
import { formatDueDate } from "@/components/task-meta";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  type Priority,
  type Project,
  type User,
} from "@/lib/types";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [leadIds, setLeadIds] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [list, memberList] = await Promise.all([
          api<Project[]>("/projects"),
          api<User[]>("/members"),
        ]);
        if (cancelled) return;
        setProjects(list);
        setMembers(memberList);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load projects",
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
  }, []);

  const addProject = useCallback(() => {
    router.push("/projects/new");
  }, [router]);

  const visibleProjects = useMemo(() => {
    const term = query.trim().toLowerCase();

    return projects.filter((project) => {
      if (term && !project.name.toLowerCase().includes(term)) return false;
      if (priorities.length && !priorities.includes(project.priority)) return false;
      if (leadIds.length && (!project.lead || !leadIds.includes(project.lead.id))) {
        return false;
      }
      return true;
    });
  }, [projects, query, priorities, leadIds]);

  return (
    <>
      <AppHeader />

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-base font-semibold tracking-tight">Projects</h1>

          <div className="flex shrink-0 items-center gap-1.5">
            {searchOpen ? (
              <div className="relative w-56">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search projects..."
                  className="h-8 pr-8 pl-8"
                  autoFocus
                />
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
                aria-label="Search projects"
                onClick={() => {
                  setSearchOpen(true);
                  requestAnimationFrame(() => searchRef.current?.focus());
                }}
              >
                <Search />
              </Button>
            )}

            <Button variant="outline" size="sm">
              <Table2 />
              Fields
            </Button>

            <ProjectFilterMenu
              priorities={priorities}
              leadIds={leadIds}
              members={members}
              onTogglePriority={(value) =>
                setPriorities((current) =>
                  current.includes(value)
                    ? current.filter((item) => item !== value)
                    : [...current, value],
                )
              }
              onToggleLead={(value) =>
                setLeadIds((current) =>
                  current.includes(value)
                    ? current.filter((item) => item !== value)
                    : [...current, value],
                )
              }
            />

            <Button size="sm" onClick={addProject}>
              <Plus />
              Add Project
            </Button>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : (
          <div className="bg-muted/30 overflow-hidden rounded-lg border">
            <ul className="divide-y md:hidden">
              {visibleProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="hover:bg-muted/40 flex flex-col gap-2 px-4 py-3 transition-colors"
                  >
                    <span className="text-sm font-medium">{project.name}</span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <PriorityBadge priority={project.priority} />
                      {project.dueDate && (
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {formatDueDate(project.dueDate)}
                        </span>
                      )}
                      {project.lead && (
                        <span className="flex items-center gap-1.5">
                          <UserAvatar user={project.lead} />
                          <span className="text-muted-foreground text-xs">
                            {project.lead.name}
                          </span>
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="min-w-56">Projects</TableHead>
                    <TableHead className="w-28">Priority</TableHead>
                    <TableHead className="w-28">Lead</TableHead>
                    <TableHead className="w-32">Due Date</TableHead>
                    <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {visibleProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium hover:underline"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={project.priority} />
                      </TableCell>
                      <TableCell>
                        {project.lead ? (
                          <div className="flex items-center gap-1.5">
                            <UserAvatar user={project.lead} />
                            <span className="text-muted-foreground truncate text-xs">
                              {project.lead.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {project.dueDate ? formatDueDate(project.dueDate) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${project.name}`}
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
              onClick={addProject}
              className={cn(
                "flex w-full items-center gap-1.5 border-t px-4 py-2 text-sm",
                "text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors",
              )}
            >
              <Plus className="size-3.5" />
              Add Projects
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function ProjectFilterMenu({
  priorities,
  leadIds,
  members,
  onTogglePriority,
  onToggleLead,
}: {
  priorities: Priority[];
  leadIds: string[];
  members: User[];
  onTogglePriority: (value: Priority) => void;
  onToggleLead: (value: string) => void;
}) {
  const active = priorities.length + leadIds.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={active > 0 ? "sm" : "icon-sm"}
          aria-label="Filter projects"
        >
          <Filter />
          {active > 0 && <span className="tabular-nums">{active}</span>}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <PriorityIcon priority="HIGH" />
            Priority
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              {PRIORITIES.map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={priorities.includes(priority)}
                  onCheckedChange={() => onTogglePriority(priority)}
                  onSelect={(event) => event.preventDefault()}
                >
                  <span className="flex items-center gap-2">
                    <PriorityIcon priority={priority} />
                    {PRIORITY_LABEL[priority]}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <UserRound />
            Lead
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-52">
              <DropdownMenuLabel>Lead</DropdownMenuLabel>
              {members.map((member) => (
                <DropdownMenuCheckboxItem
                  key={member.id}
                  checked={leadIds.includes(member.id)}
                  onCheckedChange={() => onToggleLead(member.id)}
                  onSelect={(event) => event.preventDefault()}
                >
                  <span className="flex items-center gap-2">
                    <UserAvatar user={member} className="size-4" />
                    {member.name}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
