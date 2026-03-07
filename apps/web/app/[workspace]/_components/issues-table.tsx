"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleOff,
  Clock,
  SignalHigh as HighPriorityIcon,
  SignalLow as LowPriorityIcon,
  SignalMedium as MediumPriorityIcon,
  Ellipsis as NoPriorityIcon,
  Plus,
  OctagonAlert as UrgentPriorityIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { attempt } from "@/lib/error-handling";
import { type ProjectTask } from "@/lib/projects";
import { findWorkspaceBySlug } from "@/lib/workspace";
import { CreateTaskDialog } from "../projects/_components/create-task-dialog";

const statusConfig = [
  {
    value: "backlog",
    label: "Backlog",
    icon: <CircleDashed className="text-[#f2994a]" size={14} />,
  },
  {
    value: "planned",
    label: "Planned",
    icon: <Circle className="text-[#d7d8db]" size={14} />,
  },
  {
    value: "in_progress",
    label: "In Progress",
    icon: <Clock className="text-[#f0bf00]" size={14} />,
  },
  {
    value: "completed",
    label: "Completed",
    icon: <CheckCircle2 className="text-[#5e6ad2]" size={14} />,
  },
  {
    value: "cancelled",
    label: "Cancelled",
    icon: <CircleOff className="text-[#8a8f98]" size={14} />,
  },
] as const;

const priorityConfig = [
  {
    value: 0,
    label: "No priority",
    icon: <NoPriorityIcon className="text-muted-foreground" size={14} />,
  },
  {
    value: 1,
    label: "Low",
    icon: <LowPriorityIcon className="text-sky-500" size={14} />,
  },
  {
    value: 2,
    label: "Medium",
    icon: <MediumPriorityIcon className="text-yellow-500" size={14} />,
  },
  {
    value: 3,
    label: "High",
    icon: <HighPriorityIcon className="text-orange-500" size={14} />,
  },
  {
    value: 4,
    label: "Urgent",
    icon: <UrgentPriorityIcon className="text-red-500" size={14} />,
  },
];

function formatDueDate(date?: Date): string | null {
  if (!date) {
    return null;
  }
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(id?: string): string {
  if (!id) {
    return "?";
  }
  return id.slice(0, 2).toUpperCase();
}

function TaskRow({ task }: { task: ProjectTask }) {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspace as string;
  const projectId = params.project as string;

  const status = statusConfig.find((s) => s.value === task.status);
  const priority =
    priorityConfig.find((p) => p.value === task.priority) ?? priorityConfig[0];
  const dueDate = formatDueDate(task.dueDate);
  const taskShortId = task.id.slice(0, 8).toUpperCase();

  const handleClick = () => {
    router.push(`/${workspaceId}/projects/${projectId}/issues/${task.id}`);
  };

  return (
    <button
      className="group flex w-full cursor-pointer items-center justify-between border-border/50 border-b px-4 py-2 text-left transition-colors hover:bg-accent/40"
      onClick={handleClick}
      type="button"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 opacity-60 transition-opacity group-hover:opacity-100">
          {priority?.icon}
        </span>
        <span className="w-20 shrink-0 truncate font-mono text-muted-foreground text-xs">
          {taskShortId}
        </span>
        <span className="shrink-0">{status?.icon}</span>
        <span className="truncate text-foreground text-sm">{task.name}</span>
      </div>

      <div className="ml-4 flex shrink-0 items-center gap-3">
        {dueDate !== null && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {dueDate}
          </span>
        )}
        {task.assigneeId ? (
          <div
            className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-amber-500 text-white"
            title={task.assigneeId}
          >
            <span className="font-semibold text-[10px] leading-none">
              {getInitials(task.assigneeId)}
            </span>
          </div>
        ) : (
          <div className="size-5 shrink-0 rounded-sm border border-border border-dashed" />
        )}
      </div>
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-muted-foreground text-xs italic">
        No {label.toLowerCase()} issues
      </span>
    </div>
  );
}

export default function IssuesTable({
  projectTaskData,
}: {
  projectTaskData: ProjectTask[] | undefined;
}) {
  const tasks = projectTaskData ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const params = useParams();
  const slug = decodeURIComponent(params.workspace as string);

  const { data: workspace, isLoading: isWorkspaceLoading } = useQuery({
    queryKey: ["workspace", slug],
    queryFn: async () => {
      const [result, error] = await attempt(findWorkspaceBySlug(slug));
      if (error || !result) {
        toast.error("Error while fetching workspace");
        return;
      }
      return result?.data.workspace;
    },
    enabled: !!slug,
  });

  if (isWorkspaceLoading || !workspace) {
    return null;
  }

  return (
    <div className="w-full">
      <Accordion
        defaultValue={statusConfig.map((_, i) => `item-${i}`)}
        type="multiple"
      >
        {statusConfig.map((status, index) => {
          const statusTasks = tasks.filter((t) => t.status === status.value);

          return (
            <AccordionItem
              className="border-none"
              key={status.value}
              value={`item-${index}`}
            >
              <div className="flex h-9 items-center justify-between border-border border-b bg-muted/60 px-4">
                <AccordionTrigger className="h-full flex-row-reverse gap-2 py-0 hover:no-underline [&>svg]:size-3.5 [&>svg]:text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {status.icon}
                    <span className="font-medium text-sm">{status.label}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {statusTasks.length}
                    </span>
                  </div>
                </AccordionTrigger>
                <button
                  className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setDialogOpen(true)}
                  title={`Add ${status.label} issue`}
                  type="button"
                >
                  <Plus size={13} />
                </button>
              </div>

              <AccordionContent className="pb-0">
                {statusTasks.length === 0 ? (
                  <EmptyState label={status.label} />
                ) : (
                  statusTasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      <CreateTaskDialog
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        workspace={workspace}
      />
    </div>
  );
}
