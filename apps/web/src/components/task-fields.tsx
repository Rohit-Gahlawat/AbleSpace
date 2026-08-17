"use client";

import { CalendarDays, FolderOpen, Plus, UserRound } from "lucide-react";

import { PriorityIcon } from "@/components/priority-badge";
import { formatDueDate } from "@/components/task-meta";
import { UserAvatar } from "@/components/user-avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TASK_STATUSES,
  type Priority,
  type Project,
  type TaskStatus,
  type User,
} from "@/lib/types";

export const STATUS_DOT: Record<TaskStatus, string> = {
  BACKLOG: "bg-status-backlog",
  TODO: "bg-status-todo",
  DOING: "bg-status-in-progress",
  COMPLETED: "bg-status-done",
  ON_HOLD: "bg-status-cancelled",
};

function triggerClass(plain?: boolean, active?: boolean) {
  return cn(
    "flex items-center gap-1.5 text-xs",
    plain
      ? "hover:bg-accent rounded-sm px-1.5 py-0.5"
      : "hover:bg-accent rounded-md border px-1.5 py-0.5",
    !plain && active && "bg-muted border-transparent font-medium",
  );
}

export function DateChip({
  value,
  placeholder,
  tone,
  withYear = true,
  align = "start",
  onSelect,
}: {
  value: string | null;
  placeholder: string;
  tone?: "destructive";
  withYear?: boolean;
  align?: "start" | "end";
  onSelect: (date: string | null) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "hover:bg-accent flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-xs",
            tone === "destructive" &&
              value &&
              "bg-destructive/10 text-destructive border-transparent",
          )}
        >
          <CalendarDays className="size-3" />
          {value ? formatDueDate(value, withYear) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-0">
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

export function MembersPicker({
  members,
  selected,
  onToggle,
  plain,
  compact,
  align = "start",
}: {
  members: User[];
  selected: string[];
  onToggle: (id: string) => void;
  plain?: boolean;
  compact?: boolean;
  align?: "start" | "end";
}) {
  const chosen = members.filter((member) => selected.includes(member.id));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button
            type="button"
            aria-label={chosen.length > 0 ? "Change members" : "Add members"}
            className="flex items-center gap-1"
          >
            {chosen.length > 0 ? (
              <span className="flex -space-x-1.5">
                {chosen.slice(0, 3).map((member) => (
                  <UserAvatar
                    key={member.id}
                    user={member}
                    className="ring-background size-5 ring-2"
                  />
                ))}
              </span>
            ) : (
              <span className="bg-muted text-muted-foreground hover:bg-accent flex size-5 items-center justify-center rounded-full">
                <Plus className="size-3" />
              </span>
            )}
          </button>
        ) : (
          <button type="button" className={triggerClass(plain)}>
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
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="w-52">
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

export function ProjectPicker({
  projects,
  project,
  onSelect,
  plain,
  align = "start",
}: {
  projects: Project[];
  project: Pick<Project, "id" | "name"> | null;
  onSelect: (id: string | null) => void;
  plain?: boolean;
  align?: "start" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={triggerClass(plain, Boolean(project))}>
          <FolderOpen className="size-3" />
          {project ? project.name : "Add project"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
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

export function PriorityPicker({
  priority,
  onSelect,
  align = "end",
}: {
  priority: Priority;
  onSelect: (priority: Priority) => void;
  align?: "start" | "end";
}) {
  return (
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
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel>Priority</DropdownMenuLabel>
        {PRIORITIES.map((option) => (
          <DropdownMenuItem key={option} onSelect={() => onSelect(option)}>
            <PriorityIcon priority={option} />
            {PRIORITY_LABEL[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StatusPicker({
  status,
  onSelect,
  align = "end",
}: {
  status: TaskStatus;
  onSelect: (status: TaskStatus) => void;
  align?: "start" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hover:bg-accent flex items-center gap-1.5 rounded-sm px-1.5 py-0.5"
        >
          <span className={cn("size-2 rounded-full", STATUS_DOT[status])} />
          {STATUS_LABEL[status]}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {TASK_STATUSES.map((option) => (
          <DropdownMenuItem key={option} onSelect={() => onSelect(option)}>
            <span className={cn("size-2 rounded-full", STATUS_DOT[option])} />
            {STATUS_LABEL[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
