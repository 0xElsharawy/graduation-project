"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { attempt } from "@/lib/error-handling";
import { cn } from "@/lib/utils";
import { getWorkspaceMembers, type WorkspaceMember } from "@/lib/workspace";

type Props = {
  workspaceId: string;
  currentAssigneeId?: string;
  onAssign: (userId: string | null) => void;
};

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return (email[0] ?? "?").toUpperCase();
  }
  return "?";
}

function MemberAvatar({
  member,
  className,
}: {
  member: WorkspaceMember;
  className?: string;
}) {
  return (
    <Avatar className={cn("shrink-0", className)}>
      <AvatarImage alt={member.name ?? ""} src={member.image ?? undefined} />
      <AvatarFallback className="font-medium text-[10px]">
        {getInitials(member.name, member.email)}
      </AvatarFallback>
    </Avatar>
  );
}

export function AssignUserPopover({
  workspaceId,
  currentAssigneeId,
  onAssign,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const [result, error] = await attempt(getWorkspaceMembers(workspaceId));
      if (error || !result) {
        throw new Error("Failed to fetch workspace members");
      }
      return result.data.members;
    },
    enabled: !!workspaceId,
  });

  const currentAssignee = members.find((m) => m.userId === currentAssigneeId);

  const filtered = search.trim()
    ? members.filter(
        (m) =>
          m.name?.toLowerCase().includes(search.toLowerCase()) ||
          m.email?.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  return (
    <Popover
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setSearch("");
        }
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <Button
          className="h-8 gap-2 px-2.5"
          disabled={isLoading}
          size="sm"
          type="button"
          variant="outline"
        >
          {currentAssignee ? (
            <>
              <MemberAvatar className="size-5" member={currentAssignee} />
              <span className="max-w-[120px] truncate text-sm">
                {currentAssignee.name ?? currentAssignee.email}
              </span>
            </>
          ) : (
            <>
              <UserPlus className="size-3.5" />
              <span>Assign</span>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-0" side="bottom">
        <div className="p-2">
          <Input
            autoFocus
            className="h-8 text-sm"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            value={search}
          />
        </div>

        <ScrollArea className="max-h-56">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-muted-foreground text-sm">
              No members found.
            </p>
          ) : (
            <div className="p-1">
              {filtered.map((member) => {
                const isSelected = member.userId === currentAssigneeId;
                return (
                  <button
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    key={member.id}
                    onClick={() => {
                      onAssign(member.userId);
                      setOpen(false);
                    }}
                    type="button"
                  >
                    <MemberAvatar className="size-7" member={member} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-sm">
                        {member.name ?? member.email}
                      </span>
                      {member.name !== null && member.email !== null && (
                        <span className="truncate text-muted-foreground text-xs">
                          {member.email}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto size-4 shrink-0 text-primary",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {!!currentAssigneeId && (
          <>
            <Separator />
            <div className="p-1">
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  onAssign(null);
                  setOpen(false);
                }}
                type="button"
              >
                <UserMinus className="size-4" />
                Unassign
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
