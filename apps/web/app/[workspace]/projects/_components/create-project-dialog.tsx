"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, User, Users } from "lucide-react";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { attempt } from "@/lib/error-handling";
import { type CreateProjectData, createProject } from "@/lib/projects";
import type { Workspace } from "@/lib/workspace";
import DateSelect from "./date-select";
import StatusPriority from "./status-priority";

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
};

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum([
    "backlog",
    "planned",
    "in_progress",
    "completed",
    "cancelled",
  ]),
  priority: z.number().min(0).max(4),
});

type FormValues = z.infer<typeof schema>;

export function CreateProjectDialog({
  open,
  onOpenChange,
  workspace,
}: CreateProjectDialogProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [targetDate, setTargetDate] = useState<Date>();

  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      status: "backlog",
      priority: 0,
    },
    mode: "onChange",
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const [result, error] = await attempt(createProject(workspace.id, data));
      if (error || !result) {
        throw new Error("Failed to create project");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Project created successfully");
      queryClient.invalidateQueries({ queryKey: ["projects", workspace.id] });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Error while creating project");
    },
  });

  function onSubmit(data: FormValues) {
    createMutation.mutate({
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      status: data.status,
      priority: data.priority,
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
              <BreadcrumbSeparator>
                <ChevronRight className="size-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>New Project</BreadcrumbPage>
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
                        placeholder="Project name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <StatusPriority form={form.control} />
                <div className="flex gap-2">
                  <Button
                    className="h-8 gap-1.5"
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <User className="size-3.5" />
                    Lead
                  </Button>
                  <Button
                    className="h-8 gap-1.5"
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Users className="size-3.5" />
                    Members
                  </Button>
                </div>
                <DateSelect
                  setStartDate={setStartDate}
                  setTargetDate={setTargetDate}
                  startDate={startDate}
                  targetDate={targetDate}
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
                          placeholder="Write a description, a project brief, or collect ideas..."
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
                {createMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
