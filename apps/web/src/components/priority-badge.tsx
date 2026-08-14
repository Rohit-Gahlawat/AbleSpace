import { cn } from "@/lib/utils";
import { PRIORITY_LABEL, type Priority } from "@/lib/types";

const TEXT_CLASS: Record<Priority, string> = {
  URGENT: "text-priority-urgent",
  HIGH: "text-priority-high",
  MEDIUM: "text-priority-medium",
  LOW: "text-priority-low",
  NO_PRIORITY: "text-priority-none",
};

const FILLED_BARS: Record<Priority, number> = {
  URGENT: 3,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  NO_PRIORITY: 0,
};

const BAR_HEIGHTS = ["h-1", "h-1.5", "h-2"];

export function PriorityIcon({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const filled = FILLED_BARS[priority];

  return (
    <span
      aria-hidden
      className={cn("flex h-3 items-end gap-px", TEXT_CLASS[priority], className)}
    >
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={height}
          className={cn(
            "w-0.5 rounded-[1px] bg-current",
            height,
            index < filled ? "opacity-100" : "opacity-25",
          )}
        />
      ))}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        TEXT_CLASS[priority],
        className,
      )}
    >
      <PriorityIcon priority={priority} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
