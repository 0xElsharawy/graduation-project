"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type ProjectTask } from "@/lib/projects";
import { priorityConfig, statusConfig } from "./issue-config";

const MAX_CHIPS = 3;

const statusColorMap: Record<string, string> = {
  backlog: "#f2994a",
  planned: "#d7d8db",
  in_progress: "#f0bf00",
  completed: "#5e6ad2",
  cancelled: "#8a8f98",
};

function TaskChip({ task }: { task: ProjectTask }) {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspace as string;
  const projectId = params.project as string;

  const priority =
    priorityConfig.find((p) => p.value === task.priority) ?? priorityConfig[0];
  const color = statusColorMap[task.status] ?? "#d7d8db";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${workspaceId}/projects/${projectId}/issues/${task.id}`);
  };

  return (
    <button
      className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs transition-colors hover:bg-accent/60"
      onClick={handleClick}
      title={task.name}
      type="button"
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="shrink-0 opacity-60">{priority?.icon}</span>
      <span className="min-w-0 truncate text-foreground">{task.name}</span>
    </button>
  );
}

function DayCell({
  date,
  tasks,
  isCurrentMonth,
}: {
  date: Date;
  tasks: ProjectTask[];
  isCurrentMonth: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const today = isToday(date);
  const overflowCount = tasks.length - MAX_CHIPS;
  const visibleTasks = expanded ? tasks : tasks.slice(0, MAX_CHIPS);
  const showMoreButton = !expanded && overflowCount > 0;
  const showLessButton = expanded && tasks.length > MAX_CHIPS;

  return (
    <div
      className={`min-h-24 border-border border-r border-b p-1.5 ${
        isCurrentMonth ? "" : "bg-muted/30"
      }`}
    >
      <div className="mb-1 flex justify-end">
        <span
          className={`flex size-6 items-center justify-center rounded-full font-medium text-xs tabular-nums ${
            today ? "bg-primary text-primary-foreground" : "text-foreground"
          } ${today || isCurrentMonth ? "" : "text-muted-foreground"}`}
        >
          {format(date, "d")}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        {visibleTasks.map((task) => (
          <TaskChip key={task.id} task={task} />
        ))}

        {showMoreButton ? (
          <button
            className="px-1 py-0.5 text-left text-muted-foreground text-xs transition-colors hover:text-foreground"
            onClick={() => setExpanded(true)}
            type="button"
          >
            +{overflowCount} more
          </button>
        ) : null}

        {showLessButton ? (
          <button
            className="px-1 py-0.5 text-left text-muted-foreground text-xs transition-colors hover:text-foreground"
            onClick={() => setExpanded(false)}
            type="button"
          >
            Show less
          </button>
        ) : null}
      </div>
    </div>
  );
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function IssuesCalendar({
  projectTaskData,
}: {
  projectTaskData: ProjectTask[] | undefined;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const tasks = projectTaskData ?? [];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function tasksForDay(day: Date): ProjectTask[] {
    return tasks.filter(
      (t) => t.dueDate && isSameDay(new Date(t.dueDate), day)
    );
  }

  const undatedTasks = tasks.filter((t) => !t.dueDate);

  const statusOrder = statusConfig.map((s) => s.value);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-border border-b px-4 py-2">
        <Button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          size="icon"
          variant="ghost"
        >
          <ChevronLeft size={16} />
        </Button>

        <span className="font-medium text-sm">
          {format(currentMonth, "MMMM yyyy")}
        </span>

        <Button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          size="icon"
          variant="ghost"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-7 border-border border-b">
        {WEEKDAY_LABELS.map((label) => (
          <div
            className="border-border border-r py-1.5 text-center font-medium text-muted-foreground text-xs last:border-r-0"
            key={label}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-border border-l">
        {allDays.map((day) => (
          <DayCell
            date={day}
            isCurrentMonth={isSameMonth(day, currentMonth)}
            key={day.toISOString()}
            tasks={tasksForDay(day)}
          />
        ))}
      </div>

      {undatedTasks.length > 0 && (
        <div className="border-border border-t p-4">
          <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            No due date
          </p>
          <div className="flex flex-wrap gap-1">
            {[...undatedTasks]
              .sort(
                (a, b) =>
                  statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
              )
              .map((task) => {
                const color = statusColorMap[task.status] ?? "#d7d8db";
                const status = statusConfig.find(
                  (s) => s.value === task.status
                );
                return (
                  <div
                    className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1"
                    key={task.id}
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="shrink-0">{status?.icon}</span>
                    <span className="max-w-40 truncate text-foreground text-xs">
                      {task.name}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
