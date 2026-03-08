"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { attempt } from "@/lib/error-handling";
import {
  deleteProjectTask,
  type ProjectStatus,
  type ProjectTask,
} from "@/lib/projects";
import { findWorkspaceBySlug } from "@/lib/workspace";
import { CreateTaskDialog } from "../projects/_components/create-task-dialog";
import {
  formatDueDate,
  getUsernameInitials,
  priorityConfig,
  statusConfig,
} from "./issue-config";

function TaskRow({
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

  const [usernameInitials, setUsernameInitials] = useState<string | null>(null);

  const status = statusConfig.find((s) => s.value === task.status);
  const priority =
    priorityConfig.find((p) => p.value === task.priority) ?? priorityConfig[0];
  const dueDate = formatDueDate(task.dueDate);
  const taskShortId = task.id.slice(0, 8).toUpperCase();

  const handleNavigate = () => {
    router.push(`/${workspaceId}/projects/${projectId}/issues/${task.id}`);
  };

  useEffect(() => {
    getUsernameInitials(task.assigneeId).then((initials) => {
      setUsernameInitials(initials);
    });
  }, [task.assigneeId]);

  return (
    <div className="group flex items-center border-border/50 border-b transition-colors hover:bg-accent/40">
      {/* Main clickable area */}
      <button
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2 text-left"
        onClick={handleNavigate}
        type="button"
      >
        <span className="shrink-0 opacity-50 transition-opacity group-hover:opacity-100">
          {priority?.icon}
        </span>
        <span className="w-20 shrink-0 truncate font-mono text-muted-foreground text-xs">
          {taskShortId}
        </span>
        <span className="shrink-0">{status?.icon}</span>
        <span className="truncate text-foreground text-sm">{task.name}</span>
      </button>

      <div className="flex shrink-0 items-center gap-3 pr-3">
        {dueDate !== null && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {dueDate}
          </span>
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex size-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
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
              onClick={() => onDeleteRequest(task)}
              variant="destructive"
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
  const [selectedStatus, setSelectedStatus] = useState<
    ProjectStatus | undefined
  >(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ProjectTask | null>(null);

  const tasks = projectTaskData ?? [];
  const params = useParams();
  const slug = decodeURIComponent(params.workspace as string);
  const projectId = params.project as string;

  const queryClient = useQueryClient();

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

  const { mutate: deleteTask, isPending: isDeleting } = useMutation({
    mutationFn: (taskId: string) =>
      deleteProjectTask(workspace?.id ?? "", projectId, taskId),
    onMutate: (taskId) => {
      const removeTask = (prev: ProjectTask[] | undefined) =>
        prev?.filter((t) => t.id !== taskId) ?? [];
      queryClient.setQueryData<ProjectTask[]>(["tasks", projectId], removeTask);
      queryClient.setQueryData<ProjectTask[]>(
        ["all-tasks", workspace?.id],
        removeTask
      );
      queryClient.setQueryData<ProjectTask[]>(
        ["my-tasks", workspace?.id],
        removeTask
      );
    },
    onSuccess: () => {
      toast.success("Issue deleted");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks", workspace?.id] });
    },
    onError: () => {
      toast.error("Failed to delete issue");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks", workspace?.id] });
    },
    onSettled: () => {
      setTaskToDelete(null);
    },
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
                  onClick={() => {
                    setSelectedStatus(status.value);
                    setDialogOpen(true);
                  }}
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
                    <TaskRow
                      key={task.id}
                      onDeleteRequest={setTaskToDelete}
                      task={task}
                    />
                  ))
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

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
