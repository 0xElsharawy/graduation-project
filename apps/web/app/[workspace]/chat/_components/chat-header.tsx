import { IconLock, IconWorld } from "@tabler/icons-react";
import { useState } from "react";
import { ChangeVisibilityDialog } from "./change-visibility-dialog";

export function ChatHeader({
  title,
  type,
  isLocked,
  workspaceId,
  channelId,
  visibility,
  isAdmin = false,
}: {
  title: string;
  type: "channel" | "dm";
  isLocked?: boolean;
  workspaceId?: string;
  channelId?: string;
  visibility?: "public" | "private";
  isAdmin?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex h-14 flex-shrink-0 items-center justify-between border-border border-b bg-background px-6 font-mono">
      <div className="flex items-center gap-3">
        <span className="font-bold text-lg text-muted-foreground/80">
          {type === "channel" ? "#" : "@"}
        </span>
        <h2 className="font-bold text-foreground tracking-wide">{title}</h2>
        {isLocked && (
          <span className="ml-2 flex items-center gap-1 bg-destructive px-2 py-0.5 font-bold text-destructive-foreground text-xs">
            <IconLock size={12} />
            LOCKED
          </span>
        )}
      </div>

      <div>
        {type === "channel" && visibility && workspaceId && channelId && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Access:
              </span>
              {isAdmin ? (
                <button
                  onClick={() => setDialogOpen(true)}
                  className="group flex items-center gap-1.5 border border-dashed border-input hover:border-foreground bg-background/50 hover:bg-foreground/5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 font-mono"
                  type="button"
                  title="Click to modify visibility settings"
                >
                  {visibility === "private" ? (
                    <IconLock size={12} className="text-amber-500" />
                  ) : (
                    <IconWorld size={12} className="text-muted-foreground group-hover:text-foreground" />
                  )}
                  <span className="uppercase tracking-wider font-semibold text-[10px]">
                    {visibility}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 text-[8px] text-muted-foreground uppercase transition-opacity ml-1 pl-1 border-l border-border">
                    MUTATE
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground font-mono">
                  {visibility === "private" ? (
                    <IconLock size={12} />
                  ) : (
                    <IconWorld size={12} />
                  )}
                  <span className="uppercase tracking-wider font-semibold text-[10px]">
                    {visibility}
                  </span>
                </div>
              )}
            </div>

            <ChangeVisibilityDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              workspaceId={workspaceId}
              channelId={channelId}
              channelName={title}
              currentVisibility={visibility}
            />
          </>
        )}
      </div>
    </div>
  );
}

