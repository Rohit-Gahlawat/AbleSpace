"use client";

import {
  Circle,
  ListFilter,
  SignalHigh,
  Tag,
  User as UserIcon,
} from "lucide-react";

import { PriorityIcon } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
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
  PRIORITIES,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type Label as TaskLabel,
  type Priority,
  type TaskStatus,
  type User,
} from "@/lib/types";
import { LIST_GROUPS } from "@/components/task-list";

export type TaskFilters = {
  status: TaskStatus[];
  priority: Priority[];
  assigneeIds: string[];
  labelIds: string[];
};

export const EMPTY_FILTERS: TaskFilters = {
  status: [],
  priority: [],
  assigneeIds: [],
  labelIds: [],
};

export function countActiveFilters(filters: TaskFilters) {
  return (
    filters.status.length +
    filters.priority.length +
    filters.assigneeIds.length +
    filters.labelIds.length
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function FilterMenu({
  filters,
  onChange,
  members,
  labels,
}: {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  members: User[];
  labels: TaskLabel[];
}) {
  const active = countActiveFilters(filters);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={active > 0 ? "outline" : "ghost"}
          size={active > 0 ? "sm" : "icon-sm"}
          aria-label="Filter tasks"
        >
          <ListFilter />
          {active > 0 && <span className="tabular-nums">{active}</span>}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Circle />
            Status
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {LIST_GROUPS.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filters.status.includes(status)}
                  onCheckedChange={() =>
                    onChange({ ...filters, status: toggle(filters.status, status) })
                  }
                  onSelect={(event) => event.preventDefault()}
                >
                  {STATUS_LABEL[status]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SignalHigh />
            Priority
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              {PRIORITIES.map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={filters.priority.includes(priority)}
                  onCheckedChange={() =>
                    onChange({
                      ...filters,
                      priority: toggle(filters.priority, priority),
                    })
                  }
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
            <UserIcon />
            Members
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-52">
              <DropdownMenuLabel>Members</DropdownMenuLabel>
              {members.map((member) => (
                <DropdownMenuCheckboxItem
                  key={member.id}
                  checked={filters.assigneeIds.includes(member.id)}
                  onCheckedChange={() =>
                    onChange({
                      ...filters,
                      assigneeIds: toggle(filters.assigneeIds, member.id),
                    })
                  }
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

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Tag />
            Labels
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-52">
              <DropdownMenuLabel>Labels</DropdownMenuLabel>
              {labels.map((label) => (
                <DropdownMenuCheckboxItem
                  key={label.id}
                  checked={filters.labelIds.includes(label.id)}
                  onCheckedChange={() =>
                    onChange({
                      ...filters,
                      labelIds: toggle(filters.labelIds, label.id),
                    })
                  }
                  onSelect={(event) => event.preventDefault()}
                >
                  {label.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
