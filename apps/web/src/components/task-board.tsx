"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { GripVertical, MoreHorizontal, Plus, UserRound } from "lucide-react";

import { PriorityIcon } from "@/components/priority-badge";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { STATUS_DOT } from "@/components/task-fields";
import { DueDateChip, LabelChips, MemberAvatars } from "@/components/task-meta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  advanceSpring,
  createSpring,
  dampingFor,
  useSpringValue,
  type Spring,
} from "@/lib/spring";
import {
  BOARD_COLUMNS,
  STATUS_LABEL,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import type { FieldVisibility } from "@/hooks/use-task-view";

const EDGE_SCROLL_ZONE = 72;
const EDGE_SCROLL_SPEED = 18;
const FALLBACK_COLUMN_STEP = 300;

const CARRIED_SPRING = {
  stiffness: 594,
  damping: dampingFor(594, 1),
  precision: 0.5,
};
const NEIGHBOUR_SPRING = {
  stiffness: 164,
  damping: dampingFor(164, 1),
  precision: 0.5,
};
const SLOT_SPRING = { stiffness: 172, damping: dampingFor(172, 1) };
const CARD_SPRING = { stiffness: 234, damping: dampingFor(234, 1) };

const LANDING_MS = 260;
const LANDING_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type ColumnDrag = { from: number; to: number };

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function slotAfterMove(index: number, from: number, to: number) {
  if (index === from) return to;
  if (from < index && index <= to) return index - 1;
  if (to <= index && index < from) return index + 1;
  return index;
}

export function TaskBoard({
  tasks,
  fields,
  columnOrder,
  onReorderColumns,
  onAddTask,
  onMoveTask,
  onDeleteTask,
}: {
  tasks: Task[];
  fields: FieldVisibility;
  columnOrder: TaskStatus[];
  onReorderColumns: (order: TaskStatus[]) => void;
  onAddTask: (status: TaskStatus) => void;
  onMoveTask: (taskId: string, status: TaskStatus, position: number) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [columnDrag, setColumnDrag] = useState<ColumnDrag | null>(null);
  const [panning, setPanning] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const columnEls = useRef<(HTMLElement | null)[]>([]);
  const springs = useRef<Spring[]>([]);
  const frame = useRef(0);
  const lastFrame = useRef(0);

  const dragState = useRef({ from: -1, to: -1, dx: 0, step: FALLBACK_COLUMN_STEP });
  const dragOrigin = useRef({ x: 0, scrollLeft: 0 });
  const pointerX = useRef(0);
  const carried = useRef<number[] | null>(null);
  const panOrigin = useRef<{ x: number; scrollLeft: number } | null>(null);

  const columns = columnOrder
    .map((status) => BOARD_COLUMNS.find((column) => column.status === status))
    .filter((column) => column !== undefined);

  const runAnimation = useCallback(() => {
    cancelAnimationFrame(frame.current);
    lastFrame.current = performance.now();

    function tick(now: number) {
      const elapsed = Math.min((now - lastFrame.current) / 1000, 0.064);
      lastFrame.current = now;

      const { from, to, dx, step } = dragState.current;
      const active = from !== -1;
      let settled = true;

      for (let index = 0; index < springs.current.length; index += 1) {
        const spring = springs.current[index];

        const carried = active && index === from;

        if (carried) {
          spring.target = dx;
        } else if (active) {
          spring.target =
            from < index && index <= to ? -step : to <= index && index < from ? step : 0;
        } else {
          spring.target = 0;
        }

        const done = advanceSpring(
          spring,
          elapsed,
          carried ? CARRIED_SPRING : NEIGHBOUR_SPRING,
        );
        if (!done) settled = false;

        const element = columnEls.current[index];
        if (element) {
          element.style.transform =
            spring.value === 0 ? "" : `translate3d(${spring.value}px,0,0)`;
        }
      }

      if (active) {
        const scroller = scrollerRef.current;
        if (scroller) {
          const box = scroller.getBoundingClientRect();
          const fromLeft = pointerX.current - box.left;
          const fromRight = box.right - pointerX.current;

          if (fromLeft < EDGE_SCROLL_ZONE) {
            scroller.scrollLeft -=
              EDGE_SCROLL_SPEED * (1 - Math.max(fromLeft, 0) / EDGE_SCROLL_ZONE);
          } else if (fromRight < EDGE_SCROLL_ZONE) {
            scroller.scrollLeft +=
              EDGE_SCROLL_SPEED * (1 - Math.max(fromRight, 0) / EDGE_SCROLL_ZONE);
          }
        }
      }

      if (settled && !active) {
        frame.current = 0;
        return;
      }
      frame.current = requestAnimationFrame(tick);
    }

    frame.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  useLayoutEffect(() => {
    const handed = carried.current;
    carried.current = null;

    springs.current = Array.from({ length: columnOrder.length }, (_, index) => {
      const spring = springs.current[index] ?? createSpring(0);
      if (handed) {
        spring.value = handed[index] ?? 0;
        spring.target = 0;
        spring.velocity = 0;
      }
      return spring;
    });
    columnEls.current.length = columnOrder.length;

    if (handed) runAnimation();
  }, [columnOrder, runAnimation]);

  const startColumnDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>, index: number) => {
      if (event.button !== 0) return;
      if ((event.target as HTMLElement).closest("button")) return;

      const scroller = scrollerRef.current;
      const cells = columnEls.current;
      const measured =
        cells.length > 1 && cells[0] && cells[1]
          ? cells[1].offsetLeft - cells[0].offsetLeft
          : FALLBACK_COLUMN_STEP;

      dragOrigin.current = { x: event.clientX, scrollLeft: scroller?.scrollLeft ?? 0 };
      dragState.current = {
        from: index,
        to: index,
        dx: 0,
        step: measured || FALLBACK_COLUMN_STEP,
      };
      pointerX.current = event.clientX;

      event.currentTarget.setPointerCapture(event.pointerId);
      setColumnDrag({ from: index, to: index });
      runAnimation();
    },
    [runAnimation],
  );

  const moveColumnDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const state = dragState.current;
      if (state.from === -1) return;

      pointerX.current = event.clientX;

      const scrolled =
        (scrollerRef.current?.scrollLeft ?? 0) - dragOrigin.current.scrollLeft;
      state.dx = event.clientX - dragOrigin.current.x + scrolled;

      const next = clamp(
        state.from + Math.round(state.dx / state.step),
        0,
        springs.current.length - 1,
      );

      if (next !== state.to) {
        state.to = next;
        setColumnDrag({ from: state.from, to: next });
      }
    },
    [],
  );

  const endColumnDrag = useCallback(() => {
    const { from, to, dx, step } = dragState.current;
    if (from === -1) return;

    dragState.current = { from: -1, to: -1, dx: 0, step };
    setColumnDrag(null);

    if (to === from) {
      runAnimation();
      return;
    }

    const handed = new Array<number>(springs.current.length).fill(0);
    springs.current.forEach((spring, index) => {
      const slot = slotAfterMove(index, from, to);
      const visual = index === from ? dx : spring.value;
      handed[slot] = visual + (index - slot) * step;
    });

    carried.current = handed;
    onReorderColumns(moveItem(columnOrder, from, to));
  }, [columnOrder, onReorderColumns, runAnimation]);

  useEffect(() => {
    if (!columnDrag) return;

    window.addEventListener("pointerup", endColumnDrag);
    window.addEventListener("pointercancel", endColumnDrag);
    return () => {
      window.removeEventListener("pointerup", endColumnDrag);
      window.removeEventListener("pointercancel", endColumnDrag);
    };
  }, [columnDrag, endColumnDrag]);

  function startPan(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || event.target !== event.currentTarget) return;

    panOrigin.current = {
      x: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPanning(true);
  }

  function pan(event: React.PointerEvent<HTMLDivElement>) {
    const origin = panOrigin.current;
    if (!origin) return;
    event.currentTarget.scrollLeft = origin.scrollLeft - (event.clientX - origin.x);
  }

  function endPan() {
    panOrigin.current = null;
    setPanning(false);
  }

  function slideOnWheel(event: React.WheelEvent<HTMLDivElement>) {
    const scroller = event.currentTarget;
    if (scroller.scrollWidth <= scroller.clientWidth) return;
    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

    scroller.scrollLeft += event.deltaY;
  }

  return (
    <div
      ref={scrollerRef}
      data-board-scroller
      data-panning={panning}
      data-dragging={columnDrag !== null}
      onPointerDown={startPan}
      onPointerMove={pan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onWheel={slideOnWheel}
      className="flex min-w-0 flex-1 items-start gap-3 overflow-x-auto pb-2"
    >
      {columns.map((column, index) => (
        <BoardColumn
          key={column.status}
          ref={(element) => {
            columnEls.current[index] = element;
          }}
          index={index}
          status={column.status}
          label={column.label}
          tasks={tasks.filter((task) => task.status === column.status)}
          fields={fields}
          dragging={dragging}
          lifted={columnDrag?.from === index}
          onDragStateChange={setDragging}
          onHeaderPointerDown={startColumnDrag}
          onHeaderPointerMove={moveColumnDrag}
          onHeaderPointerUp={endColumnDrag}
          onAddTask={onAddTask}
          onMoveTask={onMoveTask}
          onDeleteTask={onDeleteTask}
        />
      ))}
    </div>
  );
}

function BoardColumn({
  ref,
  index,
  status,
  label,
  tasks,
  fields,
  dragging,
  lifted,
  onDragStateChange,
  onHeaderPointerDown,
  onHeaderPointerMove,
  onHeaderPointerUp,
  onAddTask,
  onMoveTask,
  onDeleteTask,
}: {
  ref: (element: HTMLElement | null) => void;
  index: number;
  status: TaskStatus;
  label: string;
  tasks: Task[];
  fields: FieldVisibility;
  dragging: string | null;
  lifted: boolean;
  onDragStateChange: (taskId: string | null) => void;
  onHeaderPointerDown: (event: React.PointerEvent<HTMLElement>, index: number) => void;
  onHeaderPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onHeaderPointerUp: () => void;
  onAddTask: (status: TaskStatus) => void;
  onMoveTask: (taskId: string, status: TaskStatus, position: number) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const cardEls = useRef(new Map<string, HTMLElement>());
  const cardTops = useRef(new Map<string, number>());
  const dropBands = useRef<number[] | null>(null);

  function drop(position: number) {
    dropBands.current = null;
    if (!dragging) return;
    onMoveTask(dragging, status, position);
    setDropIndex(null);
    onDragStateChange(null);
  }

  function trackDropIndex(clientY: number) {
    if (!dragging) return;

    if (!dropBands.current) {
      dropBands.current = tasks.flatMap((task) => {
        const element = cardEls.current.get(task.id);
        if (!element) return [];
        const box = element.getBoundingClientRect();
        return [box.top + box.height / 2];
      });
    }

    const bands = dropBands.current;
    let next = 0;
    while (next < bands.length && clientY > bands[next]) next += 1;
    setDropIndex(next);
  }

  useEffect(() => {
    if (!dragging) dropBands.current = null;
  }, [dragging]);

  useLayoutEffect(() => {
    if (dragging) return;

    const previous = cardTops.current;
    const current = new Map<string, number>();

    cardEls.current.forEach((element, id) => {
      const top = element.offsetTop;
      current.set(id, top);

      const before = previous.get(id);
      if (before === undefined || before === top) return;

      element.animate(
        [
          { transform: `translateY(${before - top}px)` },
          { transform: "translateY(0)" },
        ],
        { duration: LANDING_MS, easing: LANDING_EASE },
      );
    });

    cardTops.current = current;
  });

  return (
    <section
      ref={ref}
      aria-label={label}
      data-board-column
      data-lifted={lifted}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setDropIndex(null);
          dropBands.current = null;
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        trackDropIndex(event.clientY);
      }}
      onDrop={(event) => {
        event.preventDefault();
        drop(dropIndex ?? tasks.length);
      }}
      className={cn(
        "bg-muted/60 flex w-72 shrink-0 flex-col self-start rounded-lg border",
        dragging && "border-dashed",
        dropIndex !== null && "border-primary/40 bg-primary/[0.05]",
        lifted && "border-primary/50 shadow-lg",
      )}
    >
      <header
        onPointerDown={(event) => onHeaderPointerDown(event, index)}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
        className="flex cursor-grab touch-none items-center gap-1.5 border-b px-3 py-2 select-none active:cursor-grabbing"
      >
        <GripVertical className="text-muted-foreground size-3.5" />
        <h2 className="text-sm font-medium">{label}</h2>
        <div className="ml-auto flex items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Add task to ${label}`}
            onClick={() => onAddTask(status)}
          >
            <Plus />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`${label} options`}>
            <MoreHorizontal />
          </Button>
        </div>
      </header>

      <div className="flex flex-col p-2">
        {tasks.map((task, position) => (
          <div key={task.id}>
            <DropSlot
              active={dropIndex === position}
              edge={position === 0 ? "start" : undefined}
            />
            <TaskCard
              task={task}
              fields={fields}
              register={(element) => {
                if (element) cardEls.current.set(task.id, element);
                else cardEls.current.delete(task.id);
              }}
              isDragging={dragging === task.id}
              onDragStart={() => onDragStateChange(task.id)}
              onDragEnd={() => {
                onDragStateChange(null);
                setDropIndex(null);
                dropBands.current = null;
              }}
              onDelete={() => onDeleteTask(task.id)}
            />
          </div>
        ))}

        <DropSlot active={dropIndex === tasks.length} edge="end" />

        <button
          type="button"
          onClick={() => onAddTask(status)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm",
            "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
          )}
        >
          <Plus className="size-3.5" />
          Add Task
        </button>
      </div>
    </section>
  );
}

function DropSlot({
  active,
  edge,
}: {
  active: boolean;
  edge?: "start" | "end";
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useSpringValue(active ? 1 : 0, SLOT_SPRING, (value) => {
    const slot = slotRef.current;
    const bar = barRef.current;
    if (!slot || !bar) return;

    const open = clamp(value, 0, 1);
    slot.style.height = `${8 + open * 24}px`;
    bar.style.width = `${open * 100}%`;
    bar.style.opacity = `${open}`;
  });

  return (
    <div ref={slotRef} className="pointer-events-none flex h-2 items-center">
      <span
        ref={barRef}
        className={cn(
          "bg-primary block h-0.5 w-0 rounded-full opacity-0",
          edge && "mx-2",
        )}
      />
    </div>
  );
}

function TaskCard({
  task,
  fields,
  register,
  isDragging,
  onDragStart,
  onDragEnd,
  onDelete,
}: {
  task: Task;
  fields: FieldVisibility;
  register: (element: HTMLElement | null) => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDelete: () => void;
}) {
  const cardRef = useRef<HTMLElement>(null);

  useSpringValue(isDragging ? 1 : 0, CARD_SPRING, (value) => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `scale(${1 - value * 0.04})`;
    card.style.opacity = `${1 - value * 0.6}`;
  });

  return (
    <article
      ref={(element) => {
        cardRef.current = element;
        register(element);
      }}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "bg-card flex cursor-grab flex-col gap-2 rounded-lg border p-3 shadow-xs",
        "active:cursor-grabbing",
      )}
    >
      <div className="flex items-start justify-between">
        <Link
          href={`/tasks/${task.id}`}
          className="min-w-0 flex-1 pr-2 text-sm font-medium hover:underline"
        >
          {task.title}
        </Link>
        <RowActionsMenu
          editHref={`/tasks/${task.id}`}
          label={task.title}
          onDelete={onDelete}
          className="-mt-1 -mr-1"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {fields.priority && <PriorityIcon priority={task.priority} />}
          {fields.members && task.assignees.length > 0 && (
            <>
              <MemberAvatars members={task.assignees} max={3} />
              {task.assignees.length === 1 && (
                <span className="truncate text-xs font-semibold">
                  {task.assignees[0].name}
                </span>
              )}
            </>
          )}
        </div>
        {fields.dueDate && task.dueDate && <DueDateChip date={task.dueDate} />}
      </div>

      {(fields.status || fields.reporter) && (
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {fields.status && (
            <span className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", STATUS_DOT[task.status])} />
              {STATUS_LABEL[task.status]}
            </span>
          )}
          {fields.reporter && (
            <span className="flex items-center gap-1">
              <UserRound className="size-3" />
              {task.reporter?.name ?? "—"}
            </span>
          )}
        </div>
      )}

      {fields.labels && task.labels.length > 0 && (
        <LabelChips labels={task.labels} max={2} />
      )}
    </article>
  );
}
