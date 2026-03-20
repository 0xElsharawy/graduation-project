"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare,
  ChevronRight,
  ClipboardCopy,
  Code2,
  GitBranch,
  Layers,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Tag,
  TrendingUp,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { convertBlueprintToTasks, getBlueprint } from "@/lib/blueprint";
import { attempt } from "@/lib/error-handling";
import { cn } from "@/lib/utils";
import { findWorkspaceBySlug } from "@/lib/workspace";

export default function BlueprintReviewPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = decodeURIComponent(params.workspace as string);
  const projectId = params.project as string;

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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["blueprint", workspaceId, projectId],
    queryFn: async () => {
      const [result, error] = await attempt(
        getBlueprint(workspaceId ?? "", projectId)
      );
      if (error) {
        toast.error("Failed to load blueprint");
        throw error;
      }
      return result ?? null;
    },
    enabled: !!workspaceId && !!projectId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 py-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Sparkles className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-sm">No blueprint yet</p>
          <p className="text-muted-foreground text-sm">
            Generate an AI blueprint to get market analysis, features, and a
            full tech plan for this project.
          </p>
        </div>
        <Button
          onClick={() =>
            router.push(`/${workspaceId}/projects/${projectId}/blueprint`)
          }
          size="sm"
        >
          <Sparkles className="mr-1.5 size-3.5" />
          Generate blueprint
        </Button>
      </div>
    );
  }

  const blueprint = data.blueprint;
  const feasibility = blueprint.feasibility;

  async function handleConvertToTasks() {
    const [result, error] = await attempt(
      convertBlueprintToTasks(workspaceId ?? "", projectId)
    );
    if (error || !result) {
      toast.error("Failed to convert features into tasks");
      return;
    }
    toast.success(`Created ${result.data.created} tasks from core features`);
  }

  const overallScore = feasibility.overallScore;
  const scoreColor = getScoreTextColor(overallScore);
  const scoreBg = getScoreBgColor(overallScore);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-6">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                <Sparkles className="size-3.5 text-primary" />
              </div>
              <h1 className="font-semibold text-xl">{blueprint.projectName}</h1>
            </div>
            <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed">
              {blueprint.summary}
            </p>
          </div>

          <div
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2",
              scoreBg
            )}
          >
            <TrendingUp className={cn("size-4", scoreColor)} />
            <div>
              <p className="text-[10px] text-muted-foreground leading-none">
                Feasibility
              </p>
              <p
                className={cn(
                  "font-bold text-base tabular-nums leading-tight",
                  scoreColor
                )}
              >
                {overallScore.toFixed(1)}
                <span className="font-normal text-xs opacity-70">/10</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button className="gap-1.5" onClick={handleConvertToTasks} size="sm">
            <CheckSquare className="size-3.5" />
            Convert to tasks
          </Button>
          <Button
            className="gap-1.5"
            onClick={() =>
              router.push(
                `/${workspaceSlug}/projects/${projectId}/blueprint/flow`
              )
            }
            size="sm"
            variant="outline"
          >
            <GitBranch className="size-3.5" />
            View user flow
            <ChevronRight className="size-3.5 opacity-50" />
          </Button>
          <Button
            className="ml-auto gap-1.5"
            onClick={() => refetch()}
            size="sm"
            variant="ghost"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </header>

      {/* Feasibility + Improvements */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-3.5 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Market feasibility</h2>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Uniqueness", value: feasibility.uniqueness },
              { label: "Stickiness", value: feasibility.stickiness },
              { label: "Growth trend", value: feasibility.growthTrend },
              {
                label: "Pricing potential",
                value: feasibility.pricingPotential,
              },
              { label: "Upsell potential", value: feasibility.upsellPotential },
              {
                label: "Customer power",
                value: feasibility.customerPurchasingPower,
              },
            ].map(({ label, value }) => (
              <ScoreBar key={label} label={label} value={value} />
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-3.5 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Improvement suggestions</h2>
          </div>
          <ul className="space-y-2">
            {blueprint.improvementSuggestions.map((item, index) => (
              <li
                className="flex gap-2.5 rounded-md border bg-background px-3 py-2 text-sm"
                key={index.toString()}
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-[10px] text-primary">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Core Features + Tech Stack */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Layers className="size-3.5 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Core features</h2>
          </div>
          <ul className="space-y-2">
            {blueprint.coreFeatures.map((feature, index) => (
              <li
                className="rounded-md border bg-background px-3 py-2.5"
                key={index.toString()}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-muted font-semibold text-[10px] text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {feature.title}
                  </p>
                </div>
                <p className="mt-1.5 text-sm">{feature.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Code2 className="size-3.5 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Recommended tech stack</h2>
          </div>
          <div className="space-y-3">
            <StackGroup
              color={"blue" as const}
              items={blueprint.techStack.frontend}
              label="Frontend"
            />
            <StackGroup
              color={"violet" as const}
              items={blueprint.techStack.backend}
              label="Backend"
            />
            <StackGroup
              color={"orange" as const}
              items={blueprint.techStack.database}
              label="Database"
            />
            <StackGroup
              color={"pink" as const}
              items={blueprint.techStack.ai}
              label="AI & tooling"
            />
          </div>
        </div>
      </div>

      {/* Pricing + DDL */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Tag className="size-3.5 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Pricing model</h2>
          </div>
          <div className="space-y-2">
            {blueprint.pricingModel.map((tier, index) => (
              <div
                className={cn(
                  "rounded-md border bg-background px-3 py-2.5",
                  index === 1 && "border-primary/30 bg-primary/5"
                )}
                key={index.toString()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs uppercase tracking-wide">
                      {tier.tier}
                    </span>
                    {index === 1 && (
                      <Badge className="h-4 rounded-full px-1.5 text-[10px]">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium font-mono text-muted-foreground text-xs">
                    {tier.price}
                  </span>
                </div>
                <ul className="mt-2 space-y-0.5">
                  {tier.features.map((f, i) => (
                    <li
                      className="flex items-start gap-1.5 text-muted-foreground text-xs"
                      key={i.toString()}
                    >
                      <span className="mt-0.5 shrink-0 text-emerald-500">
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="size-3.5 text-muted-foreground" />
              <h2 className="font-semibold text-sm">PostgreSQL DDL</h2>
            </div>
            <Button
              className="gap-1.5"
              onClick={async () => {
                await navigator.clipboard.writeText(blueprint.ddl);
                toast.success("DDL copied to clipboard");
              }}
              size="sm"
              variant="outline"
            >
              <ClipboardCopy className="size-3.5" />
              Copy
            </Button>
          </div>
          <pre className="max-h-[380px] overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
            {blueprint.ddl}
          </pre>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
        <Button
          className="gap-1.5"
          onClick={() =>
            router.push(`/${workspaceSlug}/projects/${projectId}/issues`)
          }
          size="sm"
          variant="outline"
        >
          Go to task board
          <ChevronRight className="size-3.5 opacity-50" />
        </Button>
      </div>
    </div>
  );
}

type StackColor = "blue" | "violet" | "orange" | "pink";

const STACK_COLORS: Record<StackColor, { badge: string; dot: string }> = {
  blue: {
    badge:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  violet: {
    badge:
      "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    dot: "bg-violet-500",
  },
  orange: {
    badge:
      "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
  },
  pink: {
    badge:
      "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
    dot: "bg-pink-500",
  },
};

function getScoreBarColor(value: number): string {
  if (value >= 7) {
    return "bg-emerald-500";
  }
  if (value >= 5) {
    return "bg-amber-500";
  }
  return "bg-red-500";
}

function getScoreTextColor(value: number): string {
  if (value >= 7) {
    return "text-emerald-500";
  }
  if (value >= 5) {
    return "text-amber-500";
  }
  return "text-red-500";
}

function getScoreBgColor(value: number): string {
  if (value >= 7) {
    return "bg-emerald-500/10";
  }
  if (value >= 5) {
    return "bg-amber-500/10";
  }
  return "bg-red-500/10";
}

function getScoreValueTextColor(value: number): string {
  if (value >= 7) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (value >= 5) {
    return "text-amber-600 dark:text-amber-400";
  }
  return "text-red-600 dark:text-red-400";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, (value / 10) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-medium font-mono tabular-nums",
            getScoreValueTextColor(value)
          )}
        >
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            getScoreBarColor(value)
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StackGroup({
  label,
  items,
  color,
}: {
  label: string;
  items: string[];
  color: StackColor;
}) {
  if (!items.length) {
    return null;
  }
  const colors = STACK_COLORS[color];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
        <p className="font-medium text-muted-foreground text-xs">{label}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 font-medium text-[11px]",
              colors.badge
            )}
            key={item}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
