"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAtom } from "jotai";
import { Calendar as CalendarIcon, Gauge, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { currentWorkspaceAtom } from "@/lib/atoms/current-workspace";
import { attempt } from "@/lib/error-handling";
import {
  getProjectTask,
  type ProjectStatus,
  type UpdateProjectTaskData,
  updateProjectTask,
} from "@/lib/projects";
import StatusPriority from "../../../_components/status-priority";

function PropertyRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-4 py-2">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <span className="shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

export default function TaskPage() {
  const params = useParams();
  const projectId = params.project as string;
  const taskId = params.task as string;
  const [currentWorkspace] = useAtom(currentWorkspaceAtom);

  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<
    ProjectStatus | undefined
  >();
  const [selectedPriority, setSelectedPriority] = useState<
    number | undefined
  >();

  const isInitialized = useRef(false);
  const workspaceId = currentWorkspace?.id;
  const queryClient = useQueryClient();

  const { data: taskData, isLoading } = useQuery({
    queryKey: ["task", workspaceId, projectId, taskId],
    enabled: !!workspaceId && !!projectId && !!taskId,
    queryFn: async () => {
      const [result, error] = await attempt(
        getProjectTask(workspaceId as string, projectId, taskId)
      );
      if (error || !result) {
        toast.error("Failed to load task");
        return null;
      }
      return result.data.task;
    },
  });

  useEffect(() => {
    if (!taskData) {
      return;
    }
    isInitialized.current = false;
    setTaskName(taskData.name);
    setDescription(taskData.description ?? "");
    setSelectedStatus(taskData.status);
    setSelectedPriority(taskData.priority);
    setDueDate(taskData.dueDate ? new Date(taskData.dueDate) : undefined);
    setTimeout(() => {
      isInitialized.current = true;
    }, 0);
  }, [taskData]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProjectTaskData) => {
      if (!workspaceId) {
        throw new Error("No workspace selected");
      }
      const [result, error] = await attempt(
        updateProjectTask(workspaceId, projectId, taskId, data)
      );
      if (error || !result) {
        throw new Error("Failed to update task");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Task updated");
      queryClient.invalidateQueries({ queryKey: ["projectTask", projectId] });
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status as ProjectStatus);
    updateMutation.mutate({
      status: status as ProjectStatus,
    });
  };

  const handlePriorityChange = (priority: number) => {
    setSelectedPriority(priority);
    updateMutation.mutate({
      priority,
    });
  };

  const handleDueDateChange = (date: Date | undefined) => {
    setDueDate(date);
    updateMutation.mutate({
      dueDate: date,
    });
  };

  useEffect(() => {
    if (!isInitialized.current) {
      return;
    }
    if (!taskName) {
      return;
    }

    const savedName = taskName;
    const savedDescription = description;

    const id = setTimeout(() => {
      updateMutation.mutate({
        name: savedName,
        description: savedDescription || undefined,
      });
    }, 1500);

    return () => clearTimeout(id);
  }, [taskName, description, updateMutation.mutate]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-8 py-10">
      <Textarea
        className="min-h-12 resize-none border-none bg-background! p-0 font-bold text-2xl! shadow-none focus-visible:ring-0 md:text-3xl"
        onChange={(e) => setTaskName(e.target.value)}
        placeholder="Untitled Task"
        rows={1}
        value={taskName}
      />

      <div className="flex flex-col divide-y">
        <PropertyRow
          icon={<Gauge className="size-4" />}
          label="Status & Priority"
        >
          <StatusPriority
            selectedPriority={selectedPriority}
            selectedStatus={selectedStatus}
            setSelectedPriority={handlePriorityChange}
            setSelectedStatus={handleStatusChange}
          />
        </PropertyRow>

        <PropertyRow
          icon={<CalendarIcon className="size-4" />}
          label="Due Date"
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="gap-1.5"
                size="sm"
                type="button"
                variant="outline"
              >
                {dueDate ? (
                  format(dueDate, "MMM dd, yyyy")
                ) : (
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5" />
                    <span>Set due date</span>
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                disabled={(date) => {
                  if (date < new Date(Date.now() - 1000 * 60 * 60 * 24)) {
                    return true;
                  }
                  return false;
                }}
                mode="single"
                onSelect={handleDueDateChange}
                selected={dueDate}
              />
            </PopoverContent>
          </Popover>
        </PropertyRow>

        <PropertyRow icon={<User className="size-4" />} label="Assignee">
          <span className="text-muted-foreground text-sm">No assignee</span>
        </PropertyRow>
      </div>

      <Textarea
        className="mt-8 min-h-[72px] resize-none border-none bg-background! shadow-none focus-visible:ring-0"
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a task description..."
        value={description}
      />
    </div>
  );
}
