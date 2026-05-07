"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock3, Gauge, User } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getCurrentCycle,
  getCycleSettings,
  getUpcomingCycle,
} from "@/lib/cycles";
import { attempt } from "@/lib/error-handling";
import {
  getProjectTask,
  type ProjectStatus,
  type UpdateProjectTaskData,
  updateProjectTask,
} from "@/lib/projects";
import { findWorkspaceBySlug } from "@/lib/workspace";
import { AssignUserPopover } from "../../../../../../components/assign-user-popover";
import StatusPriority from "../../../_components/status-priority";
import { CommentsSection } from "./_components/comments-section";

const NO_CYCLE_VALUE = "no-cycle";

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
  const searchParams = useSearchParams();
  const projectId = params.project as string;
  const taskId = params.task as string;
  const slug = decodeURIComponent(params.workspace as string);
  const highlightCommentId = searchParams.get("commentId");

  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<
    ProjectStatus | undefined
  >();
  const [selectedPriority, setSelectedPriority] = useState<
    number | undefined
  >();
  const [selectedAssignee, setSelectedAssignee] = useState<
    string | undefined
  >();
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  const isInitialized = useRef(false);
  const queryClient = useQueryClient();

  const { data: workspaceData, isLoading: isWorkspaceLoading } = useQuery({
    queryKey: ["workspace", slug],
    enabled: !!slug,
    queryFn: async () => {
      const [result, error] = await attempt(findWorkspaceBySlug(slug));
      if (error || !result) {
        toast.error("Error while fetching workspace");
        throw new Error("Failed to fetch workspace");
      }
      return result.data.workspace;
    },
  });

  const { data: taskData, isLoading } = useQuery({
    queryKey: ["task", workspaceData?.id, projectId, taskId],
    enabled: !!workspaceData?.id && !!projectId && !!taskId,
    queryFn: async () => {
      const [result, error] = await attempt(
        getProjectTask(workspaceData?.id ?? "", projectId, taskId)
      );
      if (error || !result) {
        toast.error("Failed to load task");
        return null;
      }
      return result.data.task;
    },
  });

  const { data: cycleSettings } = useQuery({
    queryKey: ["cycle-settings", workspaceData?.id],
    queryFn: async () => {
      const [result, error] = await attempt(
        getCycleSettings(workspaceData?.id ?? "")
      );
      if (error || !result) {
        return;
      }
      return result.data;
    },
    enabled: !!workspaceData?.id,
  });

  const { data: currentCycleData } = useQuery({
    queryKey: ["cycle", workspaceData?.id, "current"],
    queryFn: async () => {
      const [result, error] = await attempt(
        getCurrentCycle(workspaceData?.id ?? "")
      );
      if (error || !result) {
        return;
      }
      return result.data;
    },
    enabled: !!workspaceData?.id && cycleSettings?.enabled === true,
  });

  const { data: upcomingCycleData } = useQuery({
    queryKey: ["cycle", workspaceData?.id, "upcoming"],
    queryFn: async () => {
      const [result, error] = await attempt(
        getUpcomingCycle(workspaceData?.id ?? "")
      );
      if (error || !result) {
        return;
      }
      return result.data;
    },
    enabled: !!workspaceData?.id && cycleSettings?.enabled === true,
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
    setSelectedAssignee(taskData.assigneeId ?? undefined);
    setSelectedCycleId(taskData.cycleId ?? null);
    setTimeout(() => {
      isInitialized.current = true;
    }, 0);
  }, [taskData]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProjectTaskData) => {
      if (!workspaceData?.id) {
        throw new Error("No workspace selected");
      }
      const [result, error] = await attempt(
        updateProjectTask(workspaceData.id, projectId, taskId, data)
      );
      if (error || !result) {
        throw new Error("Failed to update task");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Task updated");
      queryClient.invalidateQueries({ queryKey: ["projectTask", projectId] });
      queryClient.invalidateQueries({
        queryKey: ["all-tasks", workspaceData?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-tasks", workspaceData?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["cycle", workspaceData?.id] });
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

  const handleAssigneeChange = (userId: string | null) => {
    setSelectedAssignee(userId ?? undefined);
    updateMutation.mutate({
      assigneeId: userId ?? undefined,
    });
  };

  const handleCycleChange = (value: string) => {
    const nextCycleId = value === NO_CYCLE_VALUE ? null : value;
    setSelectedCycleId(nextCycleId);
    updateMutation.mutate({
      cycleId: nextCycleId,
    });
  };

  const cycleOptions = [
    currentCycleData?.cycle,
    upcomingCycleData?.cycle,
  ].flatMap((cycle) => (cycle ? [cycle] : []));
  const uniqueCycleOptions = cycleOptions.filter(
    (cycle, index, allCycles) =>
      allCycles.findIndex((item) => item.id === cycle.id) === index
  );

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

  if (isLoading || isWorkspaceLoading) {
    return <Loading />;
  }

  return (
    <div className="px-6 py-6 md:px-8 md:py-10">
      <Textarea
        className="min-h-12 resize-none border-none bg-background! p-0 font-bold text-2xl! shadow-none focus-visible:ring-0 md:text-3xl"
        onChange={(e) => setTaskName(e.target.value)}
        placeholder="Untitled Task"
        rows={1}
        value={taskName}
      />

      <div className="flex flex-col border-b pb-4">
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
          <AssignUserPopover
            currentAssigneeId={selectedAssignee}
            onAssign={handleAssigneeChange}
            workspaceId={workspaceData?.id ?? ""}
          />
        </PropertyRow>

        <PropertyRow icon={<Clock3 className="size-4" />} label="Cycle">
          {cycleSettings?.enabled ? (
            <Select
              onValueChange={handleCycleChange}
              value={selectedCycleId ?? NO_CYCLE_VALUE}
            >
              <SelectTrigger className="h-8 w-auto" size="sm">
                <SelectValue placeholder="No cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CYCLE_VALUE}>
                  <div className="flex items-center gap-2">
                    <Clock3 className="size-4" />
                    <span>No cycle</span>
                  </div>
                </SelectItem>
                {uniqueCycleOptions.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    <div className="flex items-center gap-2">
                      <Clock3 className="size-4" />
                      <span>{cycle.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-muted-foreground text-sm">
              Cycles are disabled
            </span>
          )}
        </PropertyRow>
      </div>

      <Textarea
        className="mt-8 min-h-[72px] resize-none border-none bg-background! shadow-none focus-visible:ring-0"
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a task description..."
        value={description}
      />

      {workspaceData?.id && (
        <CommentsSection
          highlightCommentId={highlightCommentId}
          projectId={projectId}
          taskId={taskId}
          workspaceId={workspaceData.id}
        />
      )}
    </div>
  );
}
