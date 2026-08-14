"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { TasksWorkspace } from "@/components/tasks-workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, api } from "@/lib/api";
import type { Project } from "@/lib/types";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const found = await api<Project>(`/projects/${id}`);
        if (!cancelled) setProject(found);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setMissing(true);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (missing) notFound();

  return (
    <>
      <AppHeader
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name ?? "…" },
        ]}
      />

      {project ? (
        <TasksWorkspace title={project.name} projectId={project.id} />
      ) : (
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      )}
    </>
  );
}
