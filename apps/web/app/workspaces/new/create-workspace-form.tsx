"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import {
  ArrowUpRight,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { OkResponse } from "@/lib/auth-fetch";
import { attempt } from "@/lib/error-handling";
import { cn } from "@/lib/utils";
import { createWorkspace } from "@/lib/workspace";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
});

type WorkspaceFormValues = z.infer<typeof schema>;

const roadmap = [
  {
    title: "Create",
    body: "Name and slug define your workspace URL.",
  },
  {
    title: "Invite",
    body: "Add teammates with roles when you are ready.",
  },
  {
    title: "Ship",
    body: "Projects and issues start from a clean slate.",
  },
] as const;

export function CreateWorkspaceForm() {
  const router = useRouter();
  const resolver = useMemo(() => zodResolver(schema), []);

  const form = useForm<WorkspaceFormValues>({
    resolver,
    mode: "onChange",
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;
  const slugPreview = form.watch("slug") || "your-workspace";

  async function onSubmit(values: WorkspaceFormValues) {
    const [, error] = await attempt<
      OkResponse<{ workspaceId: string }>,
      AxiosError<{ message: string }>
    >(createWorkspace(values.name, values.slug));

    if (error) {
      if (
        error.message?.includes("Session expired") ||
        error.message?.includes("Unauthorized")
      ) {
        router.push("/login");
        return;
      }
      form.setError("root", {
        message: error.response?.data?.message ?? "Failed to create workspace",
      });
    } else {
      router.push(`/${encodeURIComponent(values.slug)}`);
      toast.success(`Workspace ${values.name} created successfully`);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(280px,34%)] lg:gap-10 xl:gap-14">
      <div
        className={cn(
          "relative border border-foreground/10 bg-card/80 backdrop-blur-sm dark:bg-card/60",
          "shadow-[6px_6px_0_0_oklch(0.58_0.14_48/0.22)] dark:shadow-[6px_6px_0_0_oklch(0.55_0.12_265/0.35)]",
          "motion-safe:fade-in motion-safe:animate-in motion-safe:duration-500"
        )}
      >
        <div
          aria-hidden
          className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-primary/0 via-primary/55 to-primary/0"
        />
        <div className="p-6 md:p-8">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-(family-name:--font-ws-display) font-semibold text-lg tracking-tight md:text-xl">
                Workspace details
              </h2>
              <p className="text-muted-foreground text-sm">
                Two fields — display name and URL slug.
              </p>
            </div>
            <span className="border border-foreground/15 bg-muted/50 px-2 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              ~30s
            </span>
          </div>

          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              {form.formState.errors.root?.message ? (
                <div
                  className="border border-destructive/40 bg-destructive/5 px-3 py-2 text-destructive text-sm"
                  role="alert"
                >
                  {form.formState.errors.root.message}
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Workspace name
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 text-sm"
                        placeholder="Acme Design Studio"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">URL slug</FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 font-mono text-sm"
                        placeholder="acme"
                        {...field}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "-")
                              .replace(/--+/g, "-")
                              .replace(/^-+|-+$/g, "")
                          )
                        }
                      />
                    </FormControl>
                    <div className="mt-2 border border-foreground/20 border-dashed bg-muted/40 px-2.5 py-2 font-mono text-[11px] text-muted-foreground">
                      <span className="text-muted-foreground/80">Path </span>
                      <span className="text-foreground">/{slugPreview}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-4 border-foreground/10 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-muted-foreground text-sm">
                  Nothing is shared until you invite people. You can tune roles
                  right after this step.
                </p>
                <Button
                  className="h-10 min-w-42 gap-2 border-foreground/20 bg-foreground text-background hover:bg-foreground/90 dark:bg-foreground dark:text-background"
                  disabled={isSubmitting || !isValid}
                  type="submit"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="size-4" />
                  )}
                  Create workspace
                </Button>
              </div>

              <div className="grid gap-px border border-foreground/10 bg-foreground/10 sm:grid-cols-3">
                {roadmap.map((step, i) => (
                  <div
                    className="bg-card/90 p-4 dark:bg-card/80"
                    key={step.title}
                  >
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-1 font-medium text-sm">{step.title}</p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
            </form>
          </Form>
        </div>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
        <div className="border border-foreground/10 bg-muted/30 p-5 dark:bg-muted/20">
          <div className="flex items-center gap-2 font-medium text-sm">
            <Sparkles className="size-4 text-primary" />
            What happens next
          </div>
          <ul className="mt-5 space-y-5 text-muted-foreground text-sm">
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">Role-ready</p>
                <p>
                  Owners, admins, and members stay organized with clear
                  boundaries.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Users className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">Invite when ready</p>
                <p>
                  Send invites from the workspace once the shell exists — no
                  rush.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">Private first</p>
                <p>
                  Your space stays yours until you explicitly share work with
                  the team.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
