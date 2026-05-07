"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useSetAtom } from "jotai";
import { ChevronRight, Clock3 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AssignUserPopover } from "@/components/assign-user-popover";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { projectsDataAtom } from "@/lib/atoms/projects-data";
import {
  getCurrentCycle,
  getCycleSettings,
  getUpcomingCycle,
} from "@/lib/cycles";
import { attempt } from "@/lib/error-handling";
import {
  type CreateProjectTaskData,
  createProjectTask,
  listProjects,
  ProjectStatus,
} from "@/lib/projects";
import type { Workspace } from "@/lib/workspace";
import StatusPriority from "./status-priority";

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
  status?: ProjectStatus;
  defaultCycleId?: string | null;
};

const NO_CYCLE_VALUE = "no-cycle";

const schema = z.object({
  name: z.string().min(1, "Issue name is required"),
  description: z.string().optional(),
  status: z.enum([
    "backlog",
    "planned",
    "in_progress",
    "completed",
    "cancelled",
  ]),
  priority: z.number().min(0).max(4),
  projectId: z.string().min(1, "Project is required"),
  dueDate: z.date().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  cycleId: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateTaskDialog({
  open,
  onOpenChange,
  workspace,
  status,
  defaultCycleId,
}: CreateTaskDialogProps) {
  const { project } = useParams();
  const queryClient = useQueryClient();
  const setProjectsData = useSetAtom(projectsDataAtom);
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);

  const projectId = project as string;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      status: status ?? "backlog",
      priority: 0,
      projectId: projectId || "",
      dueDate: undefined,
      assigneeId,
      cycleId: defaultCycleId ?? null,
    },
    mode: "onChange",
  });

  // Sync the status field whenever the dialog opens with a specific status
  useEffect(() => {
    if (open) {
      form.setValue("status", status ?? "backlog");
      form.setValue("cycleId", defaultCycleId ?? null);
    }
  }, [open, status, defaultCycleId, form]);

  const { data: projects } = useQuery({
    queryKey: ["projects", workspace.id],
    queryFn: async () => {
      const [result, error] = await attempt(listProjects(workspace.id));
      if (error || !result) {
        throw new Error("Failed to fetch projects");
      }
      return result.data.projects;
    },
    enabled: !!workspace.id,
  });

  const { data: cycleSettings } = useQuery({
    queryKey: ["cycle-settings", workspace.id],
    queryFn: async () => {
      const [result, error] = await attempt(getCycleSettings(workspace.id));
      if (error || !result) {
        return;
      }
      return result.data;
    },
    enabled: !!workspace.id && open,
  });

  const { data: currentCycleData } = useQuery({
    queryKey: ["cycle", workspace.id, "current"],
    queryFn: async () => {
      const [result, error] = await attempt(getCurrentCycle(workspace.id));
      if (error || !result) {
        return;
      }
      return result.data;
    },
    enabled: !!workspace.id && open && cycleSettings?.enabled === true,
  });

  const { data: upcomingCycleData } = useQuery({
    queryKey: ["cycle", workspace.id, "upcoming"],
    queryFn: async () => {
      const [result, error] = await attempt(getUpcomingCycle(workspace.id));
      if (error || !result) {
        return;
      }
      return result.data;
    },
    enabled: !!workspace.id && open && cycleSettings?.enabled === true,
  });

  useEffect(() => {
    if (projects) {
      setProjectsData(projects);
    }
  }, [projects, setProjectsData]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectTaskData) => {
      const [result, error] = await attempt(
        createProjectTask(workspace.id, data.projectId, {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        })
      );
      if (error || !result) {
        throw new Error("Failed to create issue");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Issue created successfully");

      queryClient.invalidateQueries({ queryKey: ["projects", workspace.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspace.id] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks", workspace.id] });
      queryClient.invalidateQueries({ queryKey: ["cycle", workspace.id] });

      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Error while creating issue");
    },
  });

  function onSubmit(data: FormValues) {
    createMutation.mutate({
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      status: data.status,
      priority: data.priority,
      projectId: data.projectId,
      dueDate: data.dueDate ?? undefined,
      assigneeId: assigneeId ?? undefined,
      cycleId: data.cycleId ?? undefined,
    });
  }

  function handleAssigneeChange(userId: string | null) {
    setAssigneeId(userId ?? undefined);
    form.setValue("assigneeId", userId ?? undefined);
  }

  const cycleOptions = [
    currentCycleData?.cycle,
    upcomingCycleData?.cycle,
  ].flatMap((cycle) => (cycle ? [cycle] : []));
  const uniqueCycleOptions = cycleOptions.filter(
    (cycle, index, allCycles) =>
      allCycles.findIndex((item) => item.id === cycle.id) === index
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh]! gap-0 overflow-y-auto p-0 sm:max-w-4xl!">
        <DialogHeader className="space-y-4 p-6 pb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${workspace.slug}`}>
                  {workspace.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="size-4" />
                </BreadcrumbSeparator>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>New Issue</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-6 px-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        className="h-12 border-none bg-background! p-0 font-bold text-xl! shadow-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                        placeholder="Issue name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <StatusPriority form={form.control} showProjectSelector />
                <AssignUserPopover
                  currentAssigneeId={assigneeId}
                  onAssign={handleAssigneeChange}
                  workspaceId={workspace.id}
                />
                {cycleSettings?.enabled ? (
                  <FormField
                    control={form.control}
                    name="cycleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(
                                value === NO_CYCLE_VALUE ? null : value
                              )
                            }
                            value={field.value ?? NO_CYCLE_VALUE}
                          >
                            <SelectTrigger className="h-8 w-auto" size="sm">
                              <SelectValue
                                placeholder={
                                  <div className="flex items-center gap-2">
                                    <Clock3 className="size-4" />
                                    <span>Cycle</span>
                                  </div>
                                }
                              />
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="sm" type="button" variant="outline">
                              {field.value
                                ? format(field.value, "MMM dd, yyyy")
                                : "Set due date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                              disabled={(date) =>
                                date <
                                new Date(Date.now() - 1000 * 60 * 60 * 24)
                              }
                              mode="single"
                              onSelect={field.onChange}
                              required
                              selected={field.value ?? undefined}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          className="min-h-[200px] resize-none border-none bg-background! p-0 text-base! shadow-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                          placeholder="Write a description, an issue brief, or collect ideas..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="border-t pt-4 pb-6">
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={createMutation.isPending || !form.formState.isValid}
                type="submit"
              >
                {createMutation.isPending ? "Creating..." : "Create Issue"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
