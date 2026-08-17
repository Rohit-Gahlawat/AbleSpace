"use client";

import {
  ArrowRight,
  CalendarDays,
  Circle,
  Plus,
  Settings2,
  SignalHigh,
  Tag,
  UserRound,
  UserRoundPlus,
  Users,
} from "lucide-react";

import { PriorityIcon } from "@/components/priority-badge";
import {
  DateChip,
  PriorityPicker,
  StatusPicker,
} from "@/components/task-fields";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  type Activity,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/lib/types";

export function TaskDetailsPanel({
  task,
  activity,
  onChangeStatus,
  onChangePriority,
  onChangeDates,
}: {
  task: Task;
  activity: Activity[];
  onChangeStatus: (status: TaskStatus) => void;
  onChangePriority: (priority: Priority) => void;
  onChangeDates: (dates: { startDate?: string | null; dueDate?: string | null }) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-4 lg:w-80">
      <section className="rounded-lg border">
        <header className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-medium">Details</h2>
          <div className="flex items-center">
            <Button variant="ghost" size="icon-sm" aria-label="Add property">
              <Plus />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Configure fields">
              <Settings2 />
            </Button>
          </div>
        </header>

        <dl className="flex flex-col gap-0.5 p-2 text-sm">
          <DetailRow icon={<Circle className="size-3.5" />} label="Status">
            <StatusPicker status={task.status} onSelect={onChangeStatus} />
          </DetailRow>

          <DetailRow icon={<SignalHigh className="size-3.5" />} label="Priority">
            <PriorityPicker priority={task.priority} onSelect={onChangePriority} />
          </DetailRow>

          <DetailRow icon={<UserRound className="size-3.5" />} label="Members">
            {task.assignees.length > 0 ? (
              <div className="flex items-center gap-1.5 px-1.5">
                {task.assignees.map((member) => (
                  <UserAvatar key={member.id} user={member} />
                ))}
              </div>
            ) : (
              <button
                type="button"
                className="hover:bg-accent flex items-center gap-1.5 rounded-sm px-1.5 py-0.5"
              >
                <UserRoundPlus className="size-3.5" />
                Add members
              </button>
            )}
          </DetailRow>

          <DetailRow icon={<CalendarDays className="size-3.5" />} label="Dates">
            <div className="flex items-center gap-1.5 px-1.5">
              <DateChip
                value={task.startDate}
                placeholder="Start"
                onSelect={(date) => onChangeDates({ startDate: date })}
              />
              <ArrowRight className="text-muted-foreground size-3" />
              <DateChip
                value={task.dueDate}
                placeholder="End"
                onSelect={(date) => onChangeDates({ dueDate: date })}
              />
            </div>
          </DetailRow>

          <DetailRow icon={<Tag className="size-3.5" />} label="Labels">
            <span className="text-muted-foreground px-1.5">
              {task.labels.length > 0
                ? task.labels.map((label) => label.name).join(", ")
                : "—"}
            </span>
          </DetailRow>

          <DetailRow icon={<Users className="size-3.5" />} label="Teams">
            <span className="text-muted-foreground px-1.5">Add team</span>
          </DetailRow>

          <DetailRow icon={<UserRound className="size-3.5" />} label="Reporter">
            <span className="text-muted-foreground px-1.5">
              {task.reporter?.name ?? "—"}
            </span>
          </DetailRow>
        </dl>
      </section>

      <section className="rounded-lg border">
        <header className="border-b px-3 py-2">
          <h2 className="text-sm font-medium">Updates</h2>
        </header>

        <ul className="flex flex-col gap-3 p-3">
          {activity.length === 0 && (
            <li className="text-muted-foreground text-sm">No updates yet.</li>
          )}
          {activity.map((entry) => (
            <li key={entry.id} className="flex gap-2 text-sm">
              <span className="mt-0.5">
                {entry.field === "priority" ? (
                  <PriorityIcon priority={(entry.toValue ?? "NO_PRIORITY") as Priority} />
                ) : (
                  <Circle className="text-muted-foreground size-3.5" />
                )}
              </span>
              <p className="text-muted-foreground leading-snug">
                <span className="text-foreground font-medium">
                  {entry.actor?.name ?? "Someone"}
                </span>{" "}
                changed {entry.field} from{" "}
                {formatValue(entry.field, entry.fromValue)} to{" "}
                {formatValue(entry.field, entry.toValue)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}



function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <dt className="text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </dt>
      <dd className="flex items-center">{children}</dd>
    </div>
  );
}

function formatValue(field: string, value: string | null) {
  if (!value) return "none";
  if (field === "priority") return PRIORITY_LABEL[value as Priority] ?? value;
  if (field === "status") return STATUS_LABEL[value as TaskStatus] ?? value;
  return value;
}
