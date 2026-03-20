"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const STEPS = [
  "Analyzing project description",
  "Evaluating market feasibility",
  "Identifying core features",
  "Determining technical requirements",
  "Generating database schema (DDL)",
  "Creating user flow diagram",
  "Finalizing blueprint",
] as const;

export type BlueprintStep = (typeof STEPS)[number];

export type BlueprintProgressEvent =
  | { step: BlueprintStep; status: "in_progress" | "completed" }
  | { done: true; blueprintId: string };

type GenerationProgressProps = {
  activeStep?: BlueprintStep;
};

function getStatusText(isIdle: boolean, isLastStep: boolean): string {
  if (isIdle) {
    return "Steps will appear here once generation starts";
  }
  if (isLastStep) {
    return "Almost done — wrapping up your blueprint…";
  }
  return "AI is working on your blueprint…";
}

function getStepCircleClass(isCompleted: boolean, isActive: boolean): string {
  const base =
    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300";
  if (isCompleted) {
    return `${base} border-emerald-500 bg-emerald-500/10`;
  }
  if (isActive) {
    return `${base} border-primary bg-primary/10`;
  }
  return `${base} border-border bg-transparent`;
}

function getStepTextClass(isCompleted: boolean, isActive: boolean): string {
  if (isCompleted) {
    return "pt-0.5 pb-3 text-xs transition-colors duration-300 text-emerald-600 dark:text-emerald-400";
  }
  if (isActive) {
    return "pt-0.5 pb-3 text-xs transition-colors duration-300 font-medium text-foreground";
  }
  return "pt-0.5 pb-3 text-xs transition-colors duration-300 text-muted-foreground";
}

function StepIcon({
  isCompleted,
  isActive,
}: {
  isCompleted: boolean;
  isActive: boolean;
}) {
  if (isCompleted) {
    return <CheckCircle2 className="size-3 text-emerald-500" />;
  }
  if (isActive) {
    return <Loader2 className="size-3 animate-spin text-primary" />;
  }
  return <Circle className="size-3 text-muted-foreground/30" />;
}

function StepConnector({ isCompleted }: { isCompleted: boolean }) {
  const colorClass = isCompleted ? "bg-emerald-500/40" : "bg-border";
  return (
    <div
      className={`w-px flex-1 transition-colors duration-500 ${colorClass}`}
      style={{ minHeight: "1rem" }}
    />
  );
}

export function GenerationProgress({ activeStep }: GenerationProgressProps) {
  const activeIndex = activeStep ? STEPS.indexOf(activeStep) : -1;
  const isIdle = !activeStep;
  const isLastStep = activeIndex === STEPS.length - 1;

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
      <div className="space-y-0.5">
        <h2 className="font-semibold text-sm">Generation progress</h2>
        <p className="text-muted-foreground text-xs">
          {getStatusText(isIdle, isLastStep)}
        </p>
      </div>

      <div className="space-y-0">
        {STEPS.map((step, index) => {
          const isActive = activeStep === step;
          const isCompleted = activeIndex > index;
          const hasConnector = index < STEPS.length - 1;

          return (
            <div className="flex gap-3" key={step}>
              <div className="flex flex-col items-center">
                <div className={getStepCircleClass(isCompleted, isActive)}>
                  <StepIcon isActive={isActive} isCompleted={isCompleted} />
                </div>
                {hasConnector ? (
                  <StepConnector isCompleted={isCompleted} />
                ) : null}
              </div>
              <div className={getStepTextClass(isCompleted, isActive)}>
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
