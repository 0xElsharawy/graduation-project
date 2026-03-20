"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  FileCode2,
  GitBranch,
  Layers,
  ScrollText,
  Sparkles,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Loading } from "@/components/loading";
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
import { Textarea } from "@/components/ui/textarea";
import { BACKEND_URL } from "@/lib/constants";
import { attempt } from "@/lib/error-handling";
import { cn } from "@/lib/utils";
import { findWorkspaceBySlug } from "@/lib/workspace";
import {
  type BlueprintStep,
  GenerationProgress,
} from "./_components/generation-progress";

const schema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z
    .string()
    .min(30, "Please provide at least 30 characters describing your idea"),
});

type FormValues = z.infer<typeof schema>;

const BLUEPRINT_OUTPUTS = [
  {
    icon: Brain,
    label: "Market feasibility analysis",
    description: "Scores across 6 dimensions",
  },
  {
    icon: Layers,
    label: "Core features",
    description: "AI-identified product features",
  },
  {
    icon: FileCode2,
    label: "PostgreSQL DDL schema",
    description: "Ready-to-use database schema",
  },
  {
    icon: GitBranch,
    label: "Tech stack recommendations",
    description: "Frontend, backend, DB & AI",
  },
  {
    icon: Tag,
    label: "Pricing model & user flow",
    description: "Tiers and interactive diagram",
  },
];

export default function BlueprintInputPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.project as string;
  const workspaceSlug = decodeURIComponent(params.workspace as string);

  const workspaceData = useQuery({
    queryKey: ["workspace", workspaceSlug],
    queryFn: async () => {
      const [result, error] = await attempt(findWorkspaceBySlug(workspaceSlug));
      if (error || !result) {
        toast.error("Error while fetching workspace");
      }
      return result?.data.workspace;
    },
    enabled: !!workspaceSlug,
  });

  const workspaceId = workspaceData.data?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
    },
    mode: "onChange",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState<BlueprintStep | undefined>();

  const descriptionLength = form.watch("description").length;

  async function onSubmit(values: FormValues) {
    if (isGenerating) {
      return;
    }
    setIsGenerating(true);
    setActiveStep("Analyzing project description");

    try {
      const url = new URL(
        `${BACKEND_URL}/workspaces/${workspaceId}/projects/${projectId}/blueprint/generate`
      );
      url.searchParams.set("title", values.title);
      url.searchParams.set("description", values.description);

      const eventSource = new EventSource(url.toString(), {
        withCredentials: true,
      });

      eventSource.addEventListener("progress", (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data) as {
            step?: BlueprintStep;
            status?: "in_progress" | "completed";
          };

          if (data.step) {
            setActiveStep(data.step);
          }
        } catch {
          // best-effort parsing; ignore malformed messages
        }
      });

      eventSource.addEventListener("done", (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data) as {
            done?: boolean;
            blueprintId?: string;
          };

          if (data.done && data.blueprintId) {
            eventSource.close();
            router.push(
              `/${workspaceSlug}/projects/${projectId}/blueprint/review`
            );
          }
        } catch {
          eventSource.close();
          setIsGenerating(false);
          toast.error("Error while finishing blueprint generation");
        }
      });

      eventSource.onerror = () => {
        eventSource.close();
        setIsGenerating(false);
        toast.error("Error while generating blueprint");
      };
    } catch {
      toast.error("Error while starting blueprint generation");
      setIsGenerating(false);
    }
  }

  if (!(workspaceId && projectId)) {
    return <Loading />;
  }

  return (
    <div className="mx-auto mt-4 flex w-full max-w-6xl flex-col gap-8 py-6">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-4 text-primary" />
            </div>
            <h1 className="font-semibold text-xl">AI Blueprint Generator</h1>
          </div>
          <Button
            asChild
            className="shrink-0 gap-1.5"
            size="sm"
            variant="outline"
          >
            <Link
              href={`/${workspaceSlug}/projects/${projectId}/blueprint/review`}
            >
              <ScrollText className="size-3.5" />
              View blueprint
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Describe your SaaS idea and get a complete product blueprint — market
          analysis, features, tech stack, schema, and more.
        </p>
      </div>

      <Form {...form}>
        <form
          className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isGenerating}
                      placeholder="e.g. UGC Central"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Project description</FormLabel>
                    <span
                      className={cn(
                        "text-xs tabular-nums transition-colors",
                        descriptionLength === 0 && "text-muted-foreground/50",
                        descriptionLength > 0 &&
                          descriptionLength < 30 &&
                          "text-amber-500",
                        descriptionLength >= 30 && "text-emerald-500"
                      )}
                    >
                      {descriptionLength < 30
                        ? `${descriptionLength} / 30 min`
                        : `${descriptionLength} chars`}
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      className="min-h-[220px] resize-none"
                      disabled={isGenerating}
                      placeholder="Describe your target users, the problem you're solving, key features you envision, and any technical or business constraints…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between pt-1">
              <p className="text-muted-foreground text-xs">
                More context = richer blueprint
              </p>
              <Button
                className="gap-1.5"
                disabled={isGenerating || !form.formState.isValid}
                type="submit"
              >
                <Sparkles className="size-3.5" />
                {isGenerating ? "Generating…" : "Generate blueprint"}
              </Button>
            </div>
          </div>

          {isGenerating ? (
            <GenerationProgress activeStep={activeStep} />
          ) : (
            <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
              <div className="space-y-0.5">
                <h2 className="font-semibold text-sm">What gets generated</h2>
                <p className="text-muted-foreground text-xs">
                  A complete SaaS product blueprint in one click
                </p>
              </div>

              <div className="space-y-2">
                {BLUEPRINT_OUTPUTS.map(({ icon: Icon, label, description }) => (
                  <div
                    className="flex items-start gap-3 rounded-md border bg-background px-3 py-2.5"
                    key={label}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">{label}</p>
                      <p className="text-muted-foreground text-xs">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-md bg-primary/5 px-3 py-2.5">
                <p className="text-muted-foreground text-xs leading-relaxed">
                  <span className="font-medium text-foreground">Tip:</span> The
                  more detail you include — target users, problem, constraints —
                  the more accurate and actionable your blueprint will be.
                </p>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
