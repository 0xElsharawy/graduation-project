"use client";

import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, isAfter, isBefore } from "date-fns";
import {
  CalendarDays,
  LayoutDashboard,
  LayoutList,
  Settings2,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import IssuesCalendar from "@/app/[workspace]/_components/issues-calendar";
import IssuesKanban from "@/app/[workspace]/_components/issues-kanban";
import IssuesTable from "@/app/[workspace]/_components/issues-table";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  getCurrentCycle,
  getCycleSettings,
  getUpcomingCycle,
} from "@/lib/cycles";
import { attempt } from "@/lib/error-handling";
import { findWorkspaceBySlug } from "@/lib/workspace";
import { CycleProgress } from "./cycle-progress";
import { CycleSettingsDialog } from "./cycle-settings-dialog";
import { CyclesEmptyState } from "./cycles-empty-state";

type View = "list" | "board" | "calendar";
type CycleKind = "current" | "upcoming";

function CycleTimeline({
  startDate,
  endDate,
  kind,
}: {
  startDate: Date;
  endDate: Date;
  kind: CycleKind;
}) {
  const today = new Date();
  const totalDays = differenceInCalendarDays(endDate, startDate);
  const elapsed = Math.max(
    0,
    Math.min(totalDays, differenceInCalendarDays(today, startDate))
  );
  const todayPercent =
    totalDays > 0 ? Math.round((elapsed / totalDays) * 100) : 0;

  const isActive =
    kind === "current" &&
    !isBefore(today, startDate) &&
    !isAfter(today, endDate);

  return (
    <div className="pt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          Timeline
        </span>
        {isActive && (
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#5e6ad2] opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#5e6ad2]" />
            </span>
            Live
          </span>
        )}
      </div>

      <div className="relative h-5">
        {/* track */}
        <div className="absolute top-2 right-0 left-0 h-px bg-border" />

        {/* elapsed fill */}
        {isActive && todayPercent > 0 && (
          <div
            className="absolute top-2 left-0 h-px bg-[#5e6ad2]"
            style={{
              width: `${todayPercent}%`,
              transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        )}

        {/* start cap */}
        <div className="absolute top-1.5 left-0 size-2 border border-border bg-background" />

        {/* today marker */}
        {isActive && todayPercent > 0 && todayPercent < 100 && (
          <div
            className="-translate-x-1/2 absolute"
            style={{ left: `${todayPercent}%` }}
          >
            <div className="-translate-y-[3px] absolute top-1 size-2.5 border border-[#5e6ad2] bg-[#5e6ad2]" />
          </div>
        )}

        {/* end cap */}
        <div className="absolute top-1.5 right-0 size-2 border border-border bg-background" />
      </div>

      <div className="mt-1 flex justify-between">
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {format(startDate, "MMM d")}
        </span>
        {isActive && todayPercent > 5 && todayPercent < 95 && (
          <span
            className="-translate-x-1/2 font-mono text-[#5e6ad2] text-[10px] tabular-nums"
            style={{ marginLeft: `${todayPercent}%` }}
          >
            today
          </span>
        )}
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {format(endDate, "MMM d, yyyy")}
        </span>
      </div>
    </div>
  );
}

const VIEW_TABS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "list", label: "List", icon: <LayoutList size={13} /> },
  { id: "board", label: "Board", icon: <LayoutDashboard size={13} /> },
  { id: "calendar", label: "Calendar", icon: <CalendarDays size={13} /> },
];

export function CycleView({ kind }: { kind: CycleKind }) {
  const [view, setView] = useState<View>("list");
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const slug = decodeURIComponent(params.workspace as string);

  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (
      viewParam === "list" ||
      viewParam === "board" ||
      viewParam === "calendar"
    ) {
      setView(viewParam);
    }
  }, [searchParams]);

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

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["cycle-settings", workspaceData?.id],
    enabled: !!workspaceData?.id,
    queryFn: async () => {
      const [result, error] = await attempt(
        getCycleSettings(workspaceData?.id ?? "")
      );
      if (error || !result) {
        toast.error("Error while fetching cycle settings");
        throw new Error("Failed to fetch cycle settings");
      }
      return result.data;
    },
  });

  const { data: cycleData, isLoading: isCycleLoading } = useQuery({
    queryKey: ["cycle", workspaceData?.id, kind],
    enabled: !!workspaceData?.id && settings?.enabled === true,
    queryFn: async () => {
      const cycleRequest =
        kind === "current" ? getCurrentCycle : getUpcomingCycle;
      const [result, error] = await attempt(
        cycleRequest(workspaceData?.id ?? "")
      );
      if (error || !result) {
        toast.error("Error while fetching cycle");
        throw new Error("Failed to fetch cycle");
      }
      return result.data;
    },
  });

  const cycle = cycleData?.cycle ?? null;
  const tasks = useMemo(() => cycleData?.tasks ?? [], [cycleData?.tasks]);

  if (isWorkspaceLoading || isSettingsLoading) {
    return <Loading />;
  }

  if (!(workspaceData && settings)) {
    return null;
  }

  if (!settings.enabled) {
    return (
      <CyclesEmptyState settings={settings} workspaceId={workspaceData.id} />
    );
  }

  if (isCycleLoading) {
    return <Loading />;
  }

  function changeView(next: View) {
    setView(next);
    router.replace(`/${slug}/cycles/${kind}?view=${next}`);
  }

  if (!cycle) {
    return (
      <div className="p-6">
        <div className="border border-border bg-card p-8">
          <p className="mb-3 font-mono text-muted-foreground text-xs uppercase tracking-widest">
            {kind === "current" ? "Current cycle" : "Upcoming cycle"}
          </p>
          <p className="font-mono text-2xl">No cycle yet</p>
          <p className="mt-2 font-mono text-muted-foreground text-sm">
            {kind === "current"
              ? "Your configured cycle anchor date is in the future. The upcoming cycle is ready to use."
              : "No upcoming cycle has been generated yet."}
          </p>
        </div>
      </div>
    );
  }

  const startDate = new Date(cycle.startDate);
  const endDate = new Date(cycle.endDate);
  const today = new Date();
  const daysRemaining = Math.max(0, differenceInCalendarDays(endDate, today));
  const totalDays = differenceInCalendarDays(endDate, startDate);
  const label = kind === "current" ? "Current cycle" : "Upcoming cycle";

  return (
    <div className="flex flex-col">
      {/* ── Hero header ─────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-border border-b bg-card">
        {/* subtle dot-grid background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative px-6 pt-6 pb-0">
          {/* top bar: label + settings */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block size-2"
                style={{
                  backgroundColor: kind === "current" ? "#5e6ad2" : "#f0bf00",
                }}
              />
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                {label}
              </span>
            </div>
            {settings.isAdmin ? (
              <CycleSettingsDialog
                settings={settings}
                trigger={
                  <Button
                    className="h-7 gap-1.5 font-mono text-[10px] uppercase tracking-widest"
                    size="sm"
                    variant="ghost"
                  >
                    <Settings2 size={11} />
                    Settings
                  </Button>
                }
                workspaceId={workspaceData.id}
              />
            ) : null}
          </div>

          {/* cycle name */}
          <h1 className="mb-5 font-bold font-mono text-3xl leading-none tracking-tight">
            {cycle.name}
          </h1>

          {/* metrics strip */}
          <div className="-mx-6 grid grid-cols-3 divide-x divide-border border-border border-t">
            <div className="flex flex-col gap-0.5 px-6 py-3">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Duration
              </span>
              <span className="font-bold font-mono text-xl tabular-nums leading-tight">
                {totalDays}
                <span className="ml-1 font-mono font-normal text-muted-foreground text-xs">
                  days
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5 px-6 py-3">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                {kind === "current" ? "Remaining" : "Starts in"}
              </span>
              <span className="font-bold font-mono text-xl tabular-nums leading-tight">
                {kind === "current"
                  ? daysRemaining
                  : Math.max(0, differenceInCalendarDays(startDate, today))}
                <span className="ml-1 font-mono font-normal text-muted-foreground text-xs">
                  days
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5 px-6 py-3">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Issues
              </span>
              <span className="font-bold font-mono text-xl tabular-nums leading-tight">
                {tasks.length}
              </span>
            </div>
          </div>
        </div>

        {/* timeline */}
        <div className="px-6 pt-1 pb-5">
          <CycleTimeline endDate={endDate} kind={kind} startDate={startDate} />
        </div>

        {/* progress */}
        <div className="border-border border-t">
          <CycleProgress tasks={tasks} />
        </div>
      </header>

      {/* ── View switcher ────────────────────────────────────────── */}
      <div className="flex items-center border-border border-b bg-background">
        {VIEW_TABS.map((tab) => (
          <button
            className={[
              "relative flex items-center gap-1.5 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors",
              view === tab.id
                ? "text-foreground after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:bg-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
            key={tab.id}
            onClick={() => changeView(tab.id)}
            type="button"
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      {view === "list" && (
        <IssuesTable defaultCycleId={cycle.id} projectTasksData={tasks} />
      )}
      {view === "board" && (
        <IssuesKanban defaultCycleId={cycle.id} projectTaskData={tasks} />
      )}
      {view === "calendar" && <IssuesCalendar projectTaskData={tasks} />}
    </div>
  );
}
