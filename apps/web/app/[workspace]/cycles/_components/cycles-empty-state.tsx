"use client";

import { Button } from "@/components/ui/button";
import type { CycleSettings } from "@/lib/cycles";
import { CycleSettingsDialog } from "./cycle-settings-dialog";

const GRID_ROWS = 5;
const GRID_COLS = 12;

function SprintGrid() {
  const cells = Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => i);

  return (
    <div
      className="grid opacity-20"
      style={{
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gap: "3px",
      }}
    >
      {cells.map((i) => {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        const fade = col / GRID_COLS;
        const isLit =
          (row === 0 && col < 7) ||
          (row === 1 && col < 5) ||
          (row === 2 && col < 3) ||
          (row === 3 && col < 2) ||
          (row === 4 && col < 1);

        return (
          <div
            className="aspect-square"
            key={i}
            style={{
              backgroundColor: isLit
                ? `rgba(94, 106, 210, ${0.9 - fade * 0.6})`
                : "currentColor",
              opacity: isLit ? 1 : 0.08 + fade * 0.04,
            }}
          />
        );
      })}
    </div>
  );
}

export function CyclesEmptyState({
  workspaceId,
  settings,
}: {
  workspaceId: string;
  settings?: CycleSettings;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center p-8">
      <div className="w-full max-w-md border border-border bg-card">
        {/* visual header */}
        <div className="relative overflow-hidden border-border border-b px-6 py-8">
          {/* dot grid bg */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          <div className="relative">
            <SprintGrid />
          </div>
        </div>

        {/* content */}
        <div className="px-6 py-6">
          <p className="mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            Cycles
          </p>
          <h1 className="mb-3 font-bold font-mono text-2xl leading-snug">
            Not enabled
          </h1>
          <p className="font-mono text-muted-foreground text-sm leading-relaxed">
            Use cycles when your team wants sprint planning. Issues can stay out
            of cycles, so this stays optional for lightweight workflows.
          </p>

          <div className="mt-6 border-border border-t pt-6">
            {settings?.isAdmin ? (
              <CycleSettingsDialog
                settings={settings}
                trigger={
                  <Button className="font-mono text-xs uppercase tracking-widest">
                    Enable cycles
                  </Button>
                }
                workspaceId={workspaceId}
              />
            ) : (
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-block size-1.5 shrink-0 bg-muted-foreground" />
                <p className="font-mono text-muted-foreground text-xs">
                  Ask a workspace admin to enable cycles.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
