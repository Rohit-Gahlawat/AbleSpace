"use client";

import { LayoutGrid, List, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  FIELD_LABEL,
  TOGGLEABLE_FIELDS,
  type FieldVisibility,
  type TaskField,
  type TaskView,
} from "@/hooks/use-task-view";

export function FieldsMenu({
  view,
  onViewChange,
  fields,
  onToggleField,
}: {
  view: TaskView;
  onViewChange: (view: TaskView) => void;
  fields: FieldVisibility;
  onToggleField: (field: TaskField) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Table2 />
          Fields
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 p-2">
        <div className="bg-muted mb-1.5 grid grid-cols-2 gap-1 rounded-md p-1">
          <ViewOption
            icon={<List className="size-3.5" />}
            label="List"
            active={view === "list"}
            onSelect={() => onViewChange("list")}
          />
          <ViewOption
            icon={<LayoutGrid className="size-3.5" />}
            label="Board"
            active={view === "board"}
            onSelect={() => onViewChange("board")}
          />
        </div>

        {TOGGLEABLE_FIELDS.map((field) => (
          <label
            key={field}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5",
              "hover:bg-accent text-sm",
            )}
          >
            {FIELD_LABEL[field]}
            <Checkbox
              checked={fields[field]}
              onCheckedChange={() => onToggleField(field)}
              aria-label={`Show ${FIELD_LABEL[field]} column`}
            />
          </label>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ViewOption({
  icon,
  label,
  active,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-sm px-2 py-1 text-sm font-medium",
        "transition-colors",
        active
          ? "bg-background text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
