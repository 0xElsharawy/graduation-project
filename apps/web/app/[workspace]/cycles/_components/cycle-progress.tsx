"use client";

import { useEffect, useState } from "react";
import type { ProjectTask } from "@/lib/projects";

const SEGMENTS = [
  { status: "completed", label: "Done", color: "#5e6ad2" },
  { status: "in_progress", label: "In Progress", color: "#f0bf00" },
  { status: "planned", label: "Planned", color: "#6b7280" },
  { status: "backlog", label: "Backlog", color: "#f2994a" },
] as const;

function AnimatedRing({ percent }: { percent: number }) {
  const [animated, setAnimated] = useState(0);
  const size = 120;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(percent), 80);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="-rotate-90" height={size} width={size}>
        <circle
          className="text-border"
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          stroke="#5e6ad2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          strokeWidth={stroke}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold font-mono text-2xl tabular-nums leading-none"
          style={{ letterSpacing: "-0.03em" }}
        >
          {percent}
        </span>
        <span className="mt-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          pct
        </span>
      </div>
    </div>
  );
}

export function CycleProgress({ tasks }: { tasks: ProjectTask[] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const planned = tasks.filter((t) => t.status === "planned").length;
  const backlog = tasks.filter((t) => t.status === "backlog").length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const counts: Record<string, number> = {
    completed,
    in_progress: inProgress,
    planned,
    backlog,
  };

  return (
    <div className="border border-border bg-card">
      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-[auto_1fr] sm:divide-x sm:divide-y-0">
        {/* Ring + pct */}
        <div className="flex items-center justify-center p-6 sm:px-8">
          <AnimatedRing percent={percent} />
        </div>

        {/* Right panel */}
        <div className="flex flex-col divide-y divide-border">
          {/* Segmented bar */}
          <div className="p-4 sm:p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Completion
              </span>
              <span className="font-mono text-muted-foreground text-xs tabular-nums">
                {completed}/{total} issues
              </span>
            </div>
            <div className="flex h-1.5 overflow-hidden bg-muted">
              {total > 0 &&
                SEGMENTS.map((seg) => {
                  const count = counts[seg.status] ?? 0;
                  if (count === 0) return null;
                  return (
                    <div
                      key={seg.status}
                      style={{
                        width: `${(count / total) * 100}%`,
                        backgroundColor: seg.color,
                        transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      title={`${seg.label}: ${count}`}
                    />
                  );
                })}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
            {SEGMENTS.map((seg) => {
              const count = counts[seg.status] ?? 0;
              return (
                <div
                  className="flex flex-col gap-1.5 px-4 py-3"
                  key={seg.status}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2 shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="truncate font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      {seg.label}
                    </span>
                  </div>
                  <span className="font-bold font-mono text-xl tabular-nums leading-none">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
