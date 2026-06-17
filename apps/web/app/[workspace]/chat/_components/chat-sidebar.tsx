"use client";

import { IconHash, IconMessageCircle, IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getThreads } from "@/lib/chat";
import { attempt } from "@/lib/error-handling";
import { findWorkspaceBySlug } from "@/lib/workspace";
import { CreateChannelDialog } from "./create-channel-dialog";
import { CreateDmDialog } from "./create-dm-dialog";

export function ChatSidebar() {
  const params = useParams();
  const slug = params.workspace as string;
  const pathname = usePathname();
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [dmDialogOpen, setDmDialogOpen] = useState(false);

  const { data: workspaceData, isLoading: isWorkspaceLoading } = useQuery({
    queryKey: ["workspace", slug],
    queryFn: async () => {
      const [result, error] = await attempt(findWorkspaceBySlug(slug));
      if (error || !result) {
        toast.error("Error while fetching workspace");
        throw new Error("Failed to fetch workspace");
      }
      return result.data.workspace;
    },
  });

  const workspaceId = workspaceData?.id!;

  const { data, isLoading } = useQuery({
    queryKey: ["chatThreads", workspaceId],
    queryFn: () => getThreads(workspaceId),
    enabled: !!workspaceId,
  });

  const channels = data?.channels || [];
  const dms = data?.dms || [];

  return (
    <div className="flex h-full w-64 shrink-0 flex-col overflow-hidden border-sidebar-border border-r bg-sidebar font-mono text-sidebar-foreground text-sm">
      <div className="flex items-center justify-between border-sidebar-border border-b bg-sidebar p-4">
        <h2 className="font-bold text-xs uppercase tracking-widest">
          COMMUNICATIONS
        </h2>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* CHANNELS SECTION */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold text-sidebar-foreground/60 text-xs uppercase tracking-wider">
              Channels
            </h3>

            <button
              className="rounded-none border border-transparent p-1 text-sidebar-foreground/60 transition-none hover:border-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={() => setChannelDialogOpen(true)}
              type="button"
            >
              <IconPlus size={14} />
            </button>
            <CreateChannelDialog
              onOpenChange={setChannelDialogOpen}
              open={channelDialogOpen}
              workspaceId={workspaceId}
            />
          </div>
          {isLoading || isWorkspaceLoading ? (
            <div className="flex animate-pulse flex-col space-y-2">
              <div className="h-6 w-3/4 bg-sidebar-accent" />
              <div className="h-6 w-1/2 bg-sidebar-accent" />
            </div>
          ) : (
            <ul className="space-y-1">
              {channels.map((channel) => {
                const isActive = pathname.includes(`/channels/${channel.id}`);
                return (
                  <li key={channel.id}>
                    <Link
                      className={`flex items-center gap-2 border-l-2 px-2 py-1.5 ${
                        isActive
                          ? "border-sidebar-primary bg-sidebar-accent text-sidebar-foreground"
                          : "border-transparent text-sidebar-foreground/80 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      } transition-none`}
                      href={`/${slug}/chat/channels/${channel.id}`}
                    >
                      <IconHash size={16} />
                      <span className="truncate">{channel.name}</span>
                    </Link>
                  </li>
                );
              })}
              {channels.length === 0 && (
                <li className="px-2 py-1 text-sidebar-foreground/40 italic">
                  No channels
                </li>
              )}
            </ul>
          )}
        </div>

        {/* DIRECT MESSAGES SECTION */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold text-sidebar-foreground/60 text-xs uppercase tracking-wider">
              Direct Msgs
            </h3>
            <button
              className="rounded-none border border-transparent p-1 text-sidebar-foreground/60 transition-none hover:border-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={() => setDmDialogOpen(true)}
              type="button"
            >
              <IconPlus size={14} />
            </button>
            <CreateDmDialog
              onOpenChange={setDmDialogOpen}
              open={dmDialogOpen}
              workspaceId={workspaceId}
            />
          </div>
          {isLoading ? (
            <div className="flex animate-pulse flex-col space-y-2">
              <div className="h-6 w-2/3 bg-sidebar-accent" />
            </div>
          ) : (
            <ul className="space-y-1">
              {dms.map((dm) => {
                const isActive = pathname.includes(`/dm/${dm.id}`);
                // Use participants to get names. If none, maybe fallback to "Unknown"
                const participantNames =
                  dm.participants?.map((p) => p.name).join(", ") || "Unknown";
                return (
                  <li key={dm.id}>
                    <Link
                      className={`flex items-center gap-2 border-l-2 px-2 py-1.5 ${
                        isActive
                          ? "border-sidebar-primary bg-sidebar-accent text-sidebar-foreground"
                          : "border-transparent text-sidebar-foreground/80 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      } transition-none`}
                      href={`/${slug}/chat/dm/${dm.id}`}
                    >
                      <IconMessageCircle size={16} />
                      <span className="truncate">{participantNames}</span>
                    </Link>
                  </li>
                );
              })}
              {dms.length === 0 && (
                <li className="px-2 py-1 text-sidebar-foreground/40 italic">
                  No DMs
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
