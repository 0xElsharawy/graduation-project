"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useSetAtom } from "jotai";
import { ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { projectsDataAtom } from "@/lib/atoms/projects-data";
import { attempt } from "@/lib/error-handling";
import {
  type CreateProjectTaskData,
  createProjectTask,
  listProjects,
} from "@/lib/projects";
import type { Workspace } from "@/lib/workspace";
import StatusPriority from "./status-priority";

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
};

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
});

type FormValues = z.infer<typeof schema>;

export function CreateTaskDialog({
  open,
  onOpenChange,
  workspace,
}: CreateTaskDialogProps) {
  const { project } = useParams();
  const queryClient = useQueryClient();
  const setProjectsData = useSetAtom(projectsDataAtom);

  const projectId = project as string;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      status: "backlog",
      priority: 0,
      projectId: projectId || "",
      dueDate: undefined,
    },
    mode: "onChange",
  });

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

  useEffect(() => {
    if (projects) {
      setProjectsData(projects);
    }
  }, [projects, setProjectsData]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectTaskData) => {
      const [result, error] = await attempt(
        createProjectTask(workspace.id, data.projectId, data)
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
    });
  }

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
