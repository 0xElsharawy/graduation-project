"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { attempt } from "@/lib/error-handling";
import {
  deleteProjectTask,
  type ProjectStatus,
  type ProjectTask,
  updateProjectTask,
} from "@/lib/projects";
import { findWorkspaceBySlug } from "@/lib/workspace";
import { CreateTaskDialog } from "../projects/_components/create-task-dialog";
import {
  formatDueDate,
  getUsernameInitials,
  priorityConfig,
  statusConfig,
} from "./issue-config";

// ---------------------------------------------------------------------------
// Shared card body (used by both draggable card and drag overlay)
// ---------------------------------------------------------------------------

function KanbanCardContent({ task }: { task: ProjectTask }) {
  const [usernameInitials, setUsernameInitials] = useState<string | null>(null);

  const priority =
    priorityConfig.find((p) => p.value === task.priority) ?? priorityConfig[0];
  const dueDate = formatDueDate(task.dueDate);
  const taskShortId = task.id.slice(0, 8).toUpperCase();

  useEffect(() => {
    getUsernameInitials(task.assigneeId).then(setUsernameInitials);
  }, [task.assigneeId]);

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2 pr-6">
        <span className="opacity-50 transition-opacity group-hover:opacity-100">
          {priority?.icon}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {taskShortId}
        </span>
      </div>

      <p className="mb-3 line-clamp-2 text-foreground text-sm leading-snug">
        {task.name}
      </p>

      <div className="flex items-center justify-between gap-2">
        {dueDate !== null ? (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground tabular-nums">
            {dueDate}
          </span>
        ) : (
          <span />
        )}
        {task.assigneeId ? (
          <div
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white"
            title={task.assigneeId}
          >
            <span className="font-semibold text-[10px] leading-none">
              {usernameInitials}
            </span>
          </div>
        ) : (
          <div className="size-5 shrink-0 rounded-sm border border-border border-dashed" />
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Draggable card
// ---------------------------------------------------------------------------

function KanbanCard({
  task,
  onDeleteRequest,
}: {
  task: ProjectTask;
  onDeleteRequest: (task: ProjectTask) => void;
}) {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspace as string;
  const projectId = params.project as string;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: { task } });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const handleNavigate = () => {
    router.push(`/${workspaceId}/projects/${projectId}/issues/${task.id}`);
  };

  return (
    <div
      className={`group relative rounded-md border border-border bg-card transition-colors hover:border-border/80 hover:bg-accent/20 ${
        isDragging ? "opacity-40" : ""
      }`}
      ref={setNodeRef}
      style={style}
    >
      {/* Drag handle area — covers the whole card except the menu button */}
      <button
        {...listeners}
        {...attributes}
        className="block w-full cursor-grab p-3 text-left active:cursor-grabbing"
        onClick={handleNavigate}
        type="button"
      >
        <KanbanCardContent task={task} />
      </button>

      {/* Context menu — positioned top-right, visible on hover */}
      <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:opacity-100"
              onClick={(e) => e.stopPropagation()}
              type="button"
            >
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleNavigate}>
              Open issue
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(task);
              }}
              variant={"destructive"}
            >
              <Trash2 size={14} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Ghost shown while dragging
function KanbanCardOverlay({ task }: { task: ProjectTask }) {
  return (
    <div className="w-64 cursor-grabbing rounded-md border border-border bg-card p-3 shadow-xl ring-2 ring-primary/30">
      <KanbanCardContent task={task} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------

function KanbanColumn({
  status,
  tasks,
  onAddClick,
  onDeleteRequest,
  isOver,
}: {
  status: (typeof statusConfig)[number];
  tasks: ProjectTask[];
  onAddClick: () => void;
  onDeleteRequest: (task: ProjectTask) => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: status.value });
  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => b.priority - a.priority),
    [tasks]
  );
  return (
    <div className="flex w-64 shrink-0 flex-col">
      {/* Column header */}
      <div className="mb-2 flex h-9 items-center justify-between rounded-md border border-border bg-muted/60 px-3">
        <div className="flex items-center gap-2">
          {status.icon}
          <span className="font-medium text-sm">{status.label}</span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {tasks.length}
          </span>
        </div>
        <button
          className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={onAddClick}
          title={`Add ${status.label} issue`}
          type="button"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        className={`flex min-h-20 flex-col gap-2 rounded-md p-1 transition-colors ${
          isOver ? "bg-accent/40 ring-1 ring-border" : ""
        }`}
        ref={setNodeRef}
      >
        {sortedTasks.length === 0 && !isOver ? (
          <p className="px-1 py-3 text-center text-muted-foreground text-xs italic">
            No {status.label.toLowerCase()} issues
          </p>
        ) : (
          sortedTasks.map((task) => (
            <KanbanCard
              key={task.id}
              onDeleteRequest={onDeleteRequest}
              task={task}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

export default function IssuesKanban({
  projectTaskData,
}: {
  projectTaskData: ProjectTask[] | undefined;
}) {
  const [tasks, setTasks] = useState<ProjectTask[]>(projectTaskData ?? []);
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    ProjectStatus | undefined
  >(undefined);
  const [taskToDelete, setTaskToDelete] = useState<ProjectTask | null>(null);

  const params = useParams();
  const slug = decodeURIComponent(params.workspace as string);
  const projectId = params.project as string;

  const queryClient = useQueryClient();

  useEffect(() => {
    setTasks(projectTaskData ?? []);
  }, [projectTaskData]);

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

  // --- Move task (drag) ---
  const { mutate: updateStatus } = useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: ProjectStatus;
    }) => updateProjectTask(workspace?.id ?? "", projectId, taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: () => {
      toast.error("Failed to update task status");
      setTasks(projectTaskData ?? []);
    },
  });

  // --- Delete task ---
  const { mutate: deleteTask, isPending: isDeleting } = useMutation({
    mutationFn: (taskId: string) =>
      deleteProjectTask(workspace?.id ?? "", projectId, taskId),
    onMutate: (taskId) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
    onSuccess: () => {
      toast.success("Issue deleted");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: () => {
      toast.error("Failed to delete issue");
      setTasks(projectTaskData ?? []);
    },
    onSettled: () => {
      setTaskToDelete(null);
    },
  });

  // --- DnD ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as ProjectTask;
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: { over: { id: string } | null }) {
    setOverId(event.over?.id ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    setOverId(null);

    const { active, over } = event;
    if (!over) {
      return;
    }

    const task = active.data.current?.task as ProjectTask;
    const newStatus = over.id as ProjectStatus;

    if (task.status === newStatus) {
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    updateStatus({ taskId: task.id, status: newStatus });
  }

  if (isWorkspaceLoading || !workspace) {
    return null;
  }

  return (
    <div className="w-full">
      <DndContext
        onDragEnd={handleDragEnd}
        onDragOver={(event) =>
          handleDragOver({ over: { id: (event.over?.id as string) ?? null } })
        }
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <ScrollArea className="w-full">
          <div className="flex gap-4 p-4">
            {statusConfig.map((status) => {
              const statusTasks = tasks.filter(
                (t) => t.status === status.value
              );
              return (
                <KanbanColumn
                  isOver={overId === status.value}
                  key={status.value}
                  onAddClick={() => {
                    setSelectedStatus(status.value);
                    setDialogOpen(true);
                  }}
                  onDeleteRequest={setTaskToDelete}
                  status={status}
                  tasks={statusTasks}
                />
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {activeTask ? <KanbanCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      <CreateTaskDialog
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedStatus(undefined);
          }
        }}
        open={dialogOpen}
        status={selectedStatus}
        workspace={workspace}
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setTaskToDelete(null);
          }
        }}
        open={!!taskToDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete issue?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                {taskToDelete?.name}
              </span>{" "}
              will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => {
                if (taskToDelete) {
                  deleteTask(taskToDelete.id);
                }
              }}
              variant={"destructive"}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
