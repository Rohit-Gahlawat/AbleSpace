"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  readStored,
  subscribeToStorage,
  writeStored,
} from "@/lib/client-storage";
import { BOARD_COLUMNS, isTaskStatus, type TaskStatus } from "@/lib/types";

export const TASK_VIEWS = ["list", "board"] as const;
export type TaskView = (typeof TASK_VIEWS)[number];

export const TOGGLEABLE_FIELDS = [
  "priority",
  "members",
  "dueDate",
  "labels",
  "status",
  "reporter",
] as const;
export type TaskField = (typeof TOGGLEABLE_FIELDS)[number];

export const FIELD_LABEL: Record<TaskField, string> = {
  priority: "Priority",
  members: "Members",
  dueDate: "Due Date",
  labels: "Labels",
  status: "Status",
  reporter: "Reporter",
};

export type FieldVisibility = Record<TaskField, boolean>;

const DEFAULT_FIELDS: Record<TaskView, FieldVisibility> = {
  list: {
    priority: true,
    members: true,
    dueDate: true,
    labels: false,
    status: false,
    reporter: false,
  },
  board: {
    priority: true,
    members: true,
    dueDate: true,
    labels: true,
    status: false,
    reporter: false,
  },
};

const VIEW_KEY = "pyramid.taskView";
const FIELDS_KEY = "pyramid.taskFields";
const COLUMNS_KEY = "pyramid.boardColumns";

const DEFAULT_COLUMN_ORDER = BOARD_COLUMNS.map((column) => column.status);

function isView(value: unknown): value is TaskView {
  return typeof value === "string" && (TASK_VIEWS as readonly string[]).includes(value);
}

function parseColumnOrder(raw: string | null): TaskStatus[] {
  if (!raw) return DEFAULT_COLUMN_ORDER;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_COLUMN_ORDER;

    const stored = parsed.filter(isTaskStatus);
    const missing = DEFAULT_COLUMN_ORDER.filter((status) => !stored.includes(status));
    return [...stored, ...missing];
  } catch {
    return DEFAULT_COLUMN_ORDER;
  }
}

function parseFields(raw: string | null): Record<TaskView, FieldVisibility> {
  if (!raw) return DEFAULT_FIELDS;

  try {
    const parsed = JSON.parse(raw) as Partial<
      Record<TaskView, Partial<FieldVisibility>>
    >;
    return {
      list: { ...DEFAULT_FIELDS.list, ...parsed.list },
      board: { ...DEFAULT_FIELDS.board, ...parsed.board },
    };
  } catch {
    return DEFAULT_FIELDS;
  }
}

export function useTaskView() {
  const storedView = useSyncExternalStore(
    subscribeToStorage,
    () => readStored(VIEW_KEY),
    () => null,
  );

  const storedFields = useSyncExternalStore(
    subscribeToStorage,
    () => readStored(FIELDS_KEY),
    () => null,
  );

  const storedColumns = useSyncExternalStore(
    subscribeToStorage,
    () => readStored(COLUMNS_KEY),
    () => null,
  );

  const view: TaskView = isView(storedView) ? storedView : "list";
  const fieldsByView = useMemo(() => parseFields(storedFields), [storedFields]);
  const columnOrder = useMemo(
    () => parseColumnOrder(storedColumns),
    [storedColumns],
  );

  const setView = useCallback((next: TaskView) => {
    writeStored(VIEW_KEY, next);
  }, []);

  const setColumnOrder = useCallback((next: TaskStatus[]) => {
    writeStored(COLUMNS_KEY, JSON.stringify(next));
  }, []);

  const toggleField = useCallback(
    (field: TaskField) => {
      const next = {
        ...fieldsByView,
        [view]: { ...fieldsByView[view], [field]: !fieldsByView[view][field] },
      };
      writeStored(FIELDS_KEY, JSON.stringify(next));
    },
    [fieldsByView, view],
  );

  return {
    view,
    setView,
    fields: fieldsByView[view],
    toggleField,
    columnOrder,
    setColumnOrder,
  };
}
