import { Calendar, Plus, Tag } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import type { Label as TaskLabel, User } from "@/lib/types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatDueDate(value: string, withYear = true) {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  return withYear ? `${day} ${month} ${date.getFullYear()}` : `${day} ${month}`;
}

export function DueDateChip({
  date,
  withYear = false,
  className,
}: {
  date: string;
  withYear?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5",
        "text-xs font-medium text-destructive",
        className,
      )}
    >
      <Calendar className="size-3" />
      {formatDueDate(date, withYear)}
    </span>
  );
}

export function LabelChip({ label }: { label: Pick<TaskLabel, "id" | "name"> }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium">
      <Tag className="size-3" />
      {label.name}
    </span>
  );
}

export function LabelChips({
  labels,
  max,
}: {
  labels: Pick<TaskLabel, "id" | "name">[];
  max?: number;
}) {
  const shown = max ? labels.slice(0, max) : labels;
  const overflow = labels.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((label) => (
        <LabelChip key={label.id} label={label} />
      ))}
      {overflow > 0 && (
        <span className="text-xs font-medium text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  );
}

export function MemberAvatars({
  members,
  max = 3,
  onAdd,
}: {
  members: Pick<User, "id" | "name" | "avatarUrl">[];
  max?: number;
  onAdd?: () => void;
}) {
  if (members.length === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        aria-label="Add members"
        className={cn(
          "flex size-5 items-center justify-center rounded-full border border-dashed",
          "text-muted-foreground transition-colors hover:border-solid hover:text-foreground",
        )}
      >
        <Plus className="size-3" />
      </button>
    );
  }

  const shown = members.slice(0, max);
  const overflow = members.length - shown.length;

  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((member) => (
        <UserAvatar
          key={member.id}
          user={member}
          className="ring-background ring-2"
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "ring-background flex size-5 items-center justify-center rounded-full",
            "bg-muted text-[0.625rem] font-medium ring-2",
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
