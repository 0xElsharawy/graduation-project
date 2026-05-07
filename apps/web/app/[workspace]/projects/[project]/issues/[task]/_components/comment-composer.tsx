"use client";

import { useQuery } from "@tanstack/react-query";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { getWorkspaceMembers, type WorkspaceMember } from "@/lib/workspace";

type CommentComposerProps = {
  workspaceId: string;
  onSubmit: (content: string) => Promise<void>;
  isPending?: boolean;
  initialContent?: string;
  variant?: "default" | "compact";
  className?: string;
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CommentComposer({
  workspaceId,
  onSubmit,
  isPending,
  initialContent,
  variant = "default",
  className,
}: CommentComposerProps) {
  const [content, setContent] = useState(initialContent ?? "");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchor, setMentionAnchor] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionStartRef = useRef<number>(-1);

  const isCompact = variant === "compact";

  useEffect(() => {
    if (initialContent !== undefined) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const { data: membersData } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const result = await getWorkspaceMembers(workspaceId);
      return result.data.members;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

  const filteredMembers = (membersData ?? []).filter((m) => {
    if (mentionQuery === null) return false;
    if (!mentionQuery) return true;
    return m.name?.toLowerCase().includes(mentionQuery.toLowerCase());
  });

  const closeMentionMenu = useCallback(() => {
    setMentionQuery(null);
    setMentionAnchor(null);
    mentionStartRef.current = -1;
    setHighlightedIndex(0);
  }, []);

  const insertMention = useCallback(
    (member: WorkspaceMember) => {
      const ta = textareaRef.current;
      if (!ta || mentionStartRef.current === -1) return;
      const before = content.slice(0, mentionStartRef.current);
      const after = content.slice(ta.selectionEnd);
      const chip = `@[${member.name ?? member.email ?? member.userId}](${member.userId}) `;
      const next = before + chip + after;
      setContent(next);
      closeMentionMenu();
      requestAnimationFrame(() => {
        ta.focus();
        const pos = before.length + chip.length;
        ta.setSelectionRange(pos, pos);
      });
    },
    [content, closeMentionMenu]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const caret = e.target.selectionEnd ?? 0;
    const textBefore = val.slice(0, caret);
    const atMatch = /(?:^|\s)@(\S*)$/.exec(textBefore);
    if (atMatch) {
      const query = atMatch[1] ?? "";
      setMentionQuery(query);
      setHighlightedIndex(0);

      const ta = textareaRef.current;
      if (ta) {
        const atIdx = caret - query.length - 1;
        mentionStartRef.current = atIdx;
        const rect = ta.getBoundingClientRect();
        const lineHeight =
          Number.parseInt(getComputedStyle(ta).lineHeight) || 20;
        const lines = textBefore.split("\n").length;
        setMentionAnchor({
          top: rect.top + lines * lineHeight - ta.scrollTop,
          left: rect.left + 12,
        });
      }
    } else {
      closeMentionMenu();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => (i + 1) % filteredMembers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex(
          (i) => (i - 1 + filteredMembers.length) % filteredMembers.length
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = filteredMembers[highlightedIndex];
        if (selected) insertMention(selected);
        return;
      }
      if (e.key === "Escape") {
        closeMentionMenu();
        return;
      }
    }

    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isPending) return;
    await onSubmit(trimmed);
    setContent("");
    closeMentionMenu();
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        closeMentionMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeMentionMenu]);

  const canSend = !!content.trim() && !isPending;

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex flex-col rounded-lg border border-border bg-background focus-within:ring-1 focus-within:ring-ring",
          isCompact && "rounded-md"
        )}
      >
        <textarea
          className={cn(
            "w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground",
            isCompact ? "min-h-[4.25rem]" : "min-h-[80px]",
            isPending && "cursor-not-allowed opacity-60"
          )}
          disabled={isPending}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isCompact
              ? "Update your comment…"
              : "Write a comment… (Ctrl+Enter to submit, @ to mention)"
          }
          ref={textareaRef}
          spellCheck
          value={content}
        />

        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 border-border border-t px-3 py-2",
            isCompact && "py-1.5"
          )}
        >
          <p className="text-[11px] text-muted-foreground">
            Markdown ·{" "}
            <kbd className="rounded border bg-muted px-1 py-px font-mono text-[10px]">
              Ctrl+Enter
            </kbd>
          </p>
          <Button
            className={cn(
              isCompact ? "h-7 text-xs" : "h-7 gap-1.5 px-3 text-xs"
            )}
            disabled={!canSend}
            onClick={handleSubmit}
            size="sm"
            type="button"
          >
            {isCompact ? "Save" : "Comment"}
          </Button>
        </div>
      </div>

      {mentionQuery !== null && filteredMembers.length > 0 && mentionAnchor && (
        <div
          className="fixed z-50 w-56 overflow-hidden rounded-md border bg-popover shadow-md"
          style={{ top: mentionAnchor.top + 4, left: mentionAnchor.left }}
        >
          <Command>
            <CommandList className="max-h-56">
              <CommandGroup>
                {filteredMembers
                  .slice(0, 6)
                  .map((member: WorkspaceMember, idx: number) => (
                    <CommandItem
                      className={cn(
                        "flex cursor-pointer items-center gap-2 px-2 py-1.5",
                        idx === highlightedIndex && "bg-accent"
                      )}
                      key={member.userId}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertMention(member);
                      }}
                      value={member.userId}
                    >
                      <Avatar className="size-5 rounded-md">
                        {member.image ? (
                          <AvatarImage
                            alt={member.name ?? ""}
                            src={member.image}
                          />
                        ) : null}
                        <AvatarFallback className="rounded-md text-[9px]">
                          {initials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {member.name ?? member.email}
                      </span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
