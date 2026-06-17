/** biome-ignore-all lint/style/noNestedTernary: <explanation> */
"use client";

import { IconMessageCircle, IconSearch, IconUser } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createDm } from "@/lib/chat";
import { cn } from "@/lib/utils";
import { getWorkspaceMembers } from "@/lib/workspace";

type CreateDmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
};

const schema = z.object({
  userId: z.string().min(1, "Select a member to message"),
});

type DmFormValues = z.infer<typeof schema>;

export function CreateDmDialog({
  workspaceId,
  onOpenChange,
  open,
}: CreateDmDialogProps) {
  console.log("workspaceId", workspaceId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const currentUserId = session?.user?.id;

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Fetch workspace members
  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ["workspaceMembers", workspaceId],
    queryFn: () => getWorkspaceMembers(workspaceId),
    enabled: !!workspaceId && open,
  });

  // Filter out self, apply search
  const members = useMemo(() => {
    const all = membersData?.data.members ?? [];
    return all.filter((m) => {
      if (m.userId === currentUserId) {
        return false;
      }
      if (!search.trim()) {
        return true;
      }
      const q = search.toLowerCase();
      return (
        m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
      );
    });
  }, [membersData, currentUserId, search]);

  const createDmMutation = useMutation({
    mutationFn: (userId: string) => createDm(workspaceId, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatThreads", workspaceId] });
      toast.success("Conversation started");
      handleClose();
    },
    onError: (error: AxiosError<{ message: string }>) => {
      if (
        error.message?.includes("Session expired") ||
        error.message?.includes("Unauthorized")
      ) {
        router.push("/login");
        return;
      }
      toast.error(
        error.response?.data?.message ?? "Failed to start conversation",
      );
    },
  });

  function handleClose() {
    setSearch("");
    setSelectedUserId(null);
    onOpenChange(false);
  }

  function handleSubmit() {
    if (!selectedUserId) return;
    createDmMutation.mutate(selectedUserId);
  }

  const selectedMember = members.find((m) => m.userId === selectedUserId);

  return (
    <Dialog
      onOpenChange={(v) => {
        if (v) onOpenChange(true);
        else handleClose();
      }}
      open={open}
    >
      <DialogContent className="gap-0 overflow-hidden border-border p-0 sm:max-w-sm!">
        {/* Header */}
        <DialogHeader className="border-border border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              NEW
            </span>
            <span className="font-mono text-muted-foreground/40 text-xs">
              ·
            </span>
            <DialogTitle className="font-bold font-mono text-sm uppercase tracking-widest">
              Direct Message
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col">
          {/* Search input */}
          <div
            className={cn(
              "flex items-center border-border border-b bg-background transition-colors focus-within:border-foreground/60",
            )}
          >
            <span className="flex h-10 w-10 shrink-0 select-none items-center justify-center border-border border-r bg-muted text-muted-foreground">
              <IconSearch size={14} strokeWidth={2.5} />
            </span>
            <input
              autoFocus
              className="h-10 flex-1 bg-transparent px-3 font-mono text-sm outline-none placeholder:text-muted-foreground/50"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              value={search}
            />
          </div>

          {/* Member list */}
          <div className="max-h-60 overflow-y-auto">
            {isMembersLoading ? (
              <div className="flex flex-col gap-1 p-3">
                {[1, 2, 3].map((i) => (
                  <div
                    className="flex animate-pulse items-center gap-3 px-2 py-2"
                    key={i}
                  >
                    <div className="size-7 shrink-0 rounded-full bg-muted" />
                    <div className="flex flex-col gap-1.5">
                      <div className="h-2.5 w-24 rounded-none bg-muted" />
                      <div className="h-2 w-32 rounded-none bg-muted/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <IconUser
                  className="text-muted-foreground/40"
                  size={24}
                  strokeWidth={1.5}
                />
                <p className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                  {search ? "No members found" : "No other members"}
                </p>
              </div>
            ) : (
              <ul className="py-1">
                {members.map((member) => {
                  const isSelected = selectedUserId === member.userId;
                  const initials = (member.name ?? member.email ?? "?")
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <li key={member.userId}>
                      <button
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected
                            ? "bg-foreground/5 text-foreground"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                        )}
                        onClick={() =>
                          setSelectedUserId(isSelected ? null : member.userId)
                        }
                        type="button"
                      >
                        {/* Avatar */}
                        <Avatar className="size-7 shrink-0 rounded-none">
                          {member.image && (
                            <AvatarImage
                              alt={member.name ?? ""}
                              src={member.image}
                            />
                          )}
                          <AvatarFallback className="rounded-none font-mono text-[10px]">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono font-semibold text-xs leading-tight">
                            {member.name ?? "Unnamed"}
                          </p>
                          {member.email && (
                            <p className="truncate font-mono text-[10px] leading-tight opacity-60">
                              {member.email}
                            </p>
                          )}
                        </div>

                        {/* Role badge */}
                        <span
                          className={cn(
                            "shrink-0 font-mono text-[9px] uppercase tracking-widest",
                            member.role === "admin"
                              ? "text-foreground/70"
                              : "text-muted-foreground/50",
                          )}
                        >
                          {member.role}
                        </span>

                        {/* Selection indicator */}
                        {isSelected && (
                          <span className="ml-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Selected preview strip */}
          {selectedMember && (
            <div className="flex items-center gap-2 border-border border-t bg-muted/30 px-4 py-2.5">
              <IconMessageCircle
                className="shrink-0 text-muted-foreground"
                size={12}
                strokeWidth={2.5}
              />
              <span className="font-mono text-[10px] text-muted-foreground">
                Messaging{" "}
                <span className="font-semibold text-foreground">
                  {selectedMember.name ?? selectedMember.email}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-border border-t px-6 py-4">
          <Button
            className="rounded-none font-mono text-xs uppercase tracking-widest"
            onClick={handleClose}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="rounded-none font-mono text-xs uppercase tracking-widest"
            disabled={!selectedUserId || createDmMutation.isPending}
            onClick={handleSubmit}
            type="button"
          >
            {createDmMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Opening…
              </span>
            ) : (
              "Open DM"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
