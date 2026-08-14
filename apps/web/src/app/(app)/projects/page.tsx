"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ListFilter, MoreHorizontal, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-header";
import { PriorityBadge } from "@/components/priority-badge";
import { formatDueDate } from "@/components/task-meta";
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
import { Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = await api<Project[]>("/projects");
        if (!cancelled) setProjects(list);
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

  const addProject = useCallback(async () => {
    try {
      const created = await api<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({ name: "New project" }),
      });
      setProjects((current) => [...current, created]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create the project",
      );
    }
  }, []);

  return (
    <>
      <AppHeader />

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-base font-semibold tracking-tight">Projects</h1>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon-sm" aria-label="Search projects">
              <Search />
            </Button>
            <Button variant="outline" size="sm">
              <Table2 />
              Fields
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Filter projects">
              <ListFilter />
            </Button>
            <Button size="sm" onClick={() => void addProject()}>
              <Plus />
              Add Project
            </Button>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <ul className="divide-y md:hidden">
              {projects.map((project) => (
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
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="min-w-56">Projects</TableHead>
                    <TableHead className="w-28">Priority</TableHead>
                    <TableHead className="w-28">Lead</TableHead>
                    <TableHead className="w-32">Due Date</TableHead>
                    <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {projects.map((project) => (
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
              onClick={() => void addProject()}
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
