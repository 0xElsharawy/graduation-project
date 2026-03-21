"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, MoreHorizontal, Plus, Trash2 } from "lucide-react";
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
  const dueDate = task.dueDate ? formatDueDate(task.dueDate) : null;
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
    <div className="group hover:-translate-y-[2px] relative flex items-stretch border-border/40 border-b bg-background transition-all duration-300 hover:z-10 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
      <div className="flex w-16 shrink-0 items-center justify-center border-border/40 border-r px-2 font-mono text-[10px] text-muted-foreground tracking-wider">
        {taskShortId}
      </div>

      <div className="flex w-12 shrink-0 items-center justify-center border-border/40 border-r opacity-70 transition-opacity group-hover:opacity-100">
        {priority?.icon}
      </div>

      <button
        className="flex min-w-0 flex-1 items-center gap-4 px-5 py-3 text-left outline-none"
        onClick={handleNavigate}
        type="button"
      >
        <span className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
          {task.name}
        </span>
        <ArrowRight className="-translate-x-2 size-3 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </button>

      <div className="flex shrink-0 items-center border-border/40 border-l">
        {dueDate !== null && (
          <div className="flex h-full items-center justify-center border-border/40 border-r px-4">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              {dueDate}
            </span>
          </div>
        )}

        <div className="flex h-full w-14 items-center justify-center border-border/40 border-r">
          {task.assigneeName ? (
            <div
              className="flex size-6 items-center justify-center rounded border border-primary/20 bg-primary/10 text-primary"
              title={task.assigneeName}
            >
              <span className="font-bold font-mono text-[10px] leading-none">
                {task.assigneeName?.slice(0, 2).toUpperCase() ?? "?"}
              </span>
            </div>
          ) : (
            <div className="size-6 rounded border border-border/50 border-dashed bg-muted/30" />
          )}
        </div>

        <div className="flex h-full items-center justify-center px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-all hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
              >
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-none border-2 p-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
            >
              <DropdownMenuItem
                className="cursor-pointer rounded-none px-4 py-3 font-mono text-xs uppercase tracking-wider focus:bg-primary focus:text-primary-foreground"
                onClick={handleNavigate}
              >
                Open issue
              </DropdownMenuItem>
              <DropdownMenuSeparator className="m-0" />
              <DropdownMenuItem
                className="cursor-pointer rounded-none px-4 py-3 font-mono text-destructive text-xs uppercase tracking-wider focus:bg-destructive focus:text-destructive-foreground"
                onClick={() => onDeleteRequest(task)}
              >
                <Trash2 className="mr-2" size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border-border/40 border-b bg-muted/10 py-12">
      <div className="mb-2 flex size-12 items-center justify-center rounded-full border border-border border-dashed text-muted-foreground/50">
        <span className="font-serif text-2xl italic">?</span>
      </div>
      <span className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
        No {label} issues
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
    <div className="w-full border-border/40 border-x border-t bg-background/50 backdrop-blur-sm">
      <Accordion
        className="w-full"
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
              <div className="group flex items-stretch border-border/60 border-b bg-muted/20 transition-colors hover:bg-muted/40">
                <div className="flex w-12 shrink-0 items-center justify-center border-border/40 border-r">
                  {status.icon}
                </div>

                <AccordionTrigger className="flex flex-1 items-center justify-between px-4 py-2 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif tracking-tight">
                      {status.label}
                    </span>
                    <span className="rounded-full bg-foreground/10 px-2 py-0.5 font-bold font-mono text-[10px] text-foreground">
                      {statusTasks.length}
                    </span>
                  </div>
                </AccordionTrigger>

                <div className="flex items-center border-border/40 border-l px-3">
                  <button
                    className="group/btn relative flex size-6 items-center justify-center overflow-hidden rounded border border-border bg-background shadow-sm transition-all hover:border-foreground hover:bg-foreground hover:text-background"
                    onClick={() => {
                      setSelectedStatus(status.value);
                      setDialogOpen(true);
                    }}
                    title={`Add ${status.label} issue`}
                    type="button"
                  >
                    <Plus
                      className="relative z-10 transition-transform group-hover/btn:rotate-90"
                      size={12}
                    />
                  </button>
                </div>
              </div>

              <AccordionContent className="pt-0 pb-0">
                <div className="flex flex-col">
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
                </div>
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
        <AlertDialogContent className="rounded-none border-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl">
              Delete issue?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-sm leading-relaxed">
              <span className="bg-muted px-1 py-0.5 font-bold text-foreground">
                {taskToDelete?.name}
              </span>{" "}
              will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3 sm:gap-0">
            <AlertDialogCancel
              className="rounded-none font-mono text-xs uppercase tracking-wider"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none font-mono text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
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
