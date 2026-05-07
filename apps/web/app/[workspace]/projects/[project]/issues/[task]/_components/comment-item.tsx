"use client";

import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskComment } from "@/lib/comments";
import { cn } from "@/lib/utils";
import { CommentComposer } from "./comment-composer";

const MENTION_REGEX = /@\[([^\]]+)\]\(([0-9a-f-]{36})\)/g;

function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(MENTION_REGEX)) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      parts.push(...applyInlineMarkdown(before, key));
      key += 100;
    }
    parts.push(
      <span
        className="inline-flex items-center rounded bg-primary/15 px-1 font-medium text-primary text-sm"
        key={`mention-${key++}`}
      >
        @{match[1]}
      </span>
    );
    lastIndex = (match.index ?? 0) + match[0].length;
  }

  const remaining = text.slice(lastIndex);
  if (remaining) {
    parts.push(...applyInlineMarkdown(remaining, key));
  }

  return parts;
}

function applyInlineMarkdown(text: string, baseKey: number): React.ReactNode[] {
  const pattern =
    /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;

  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  let k = baseKey;

  for (const m of text.matchAll(pattern)) {
    const plain = text.slice(lastIdx, m.index);
    if (plain) nodes.push(<span key={k++}>{plain}</span>);

    if (m[1]) {
      nodes.push(<strong key={k++}>{m[2]}</strong>);
    } else if (m[3]) {
      nodes.push(<em key={k++}>{m[4]}</em>);
    } else if (m[5]) {
      nodes.push(
        <code
          className="rounded bg-muted px-1 font-mono text-[0.8em]"
          key={k++}
        >
          {m[6]}
        </code>
      );
    } else if (m[7]) {
      nodes.push(
        <a
          className="text-primary underline underline-offset-2"
          href={m[9]}
          key={k++}
          rel="noopener noreferrer"
          target="_blank"
        >
          {m[8]}
        </a>
      );
    }

    lastIdx = (m.index ?? 0) + m[0].length;
  }

  const tail = text.slice(lastIdx);
  if (tail) nodes.push(<span key={k++}>{tail}</span>);

  return nodes;
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type CommentItemProps = {
  comment: TaskComment;
  currentUserId?: string;
  isAdmin?: boolean;
  workspaceId: string;
  highlighted?: boolean;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => void;
  isEditPending?: boolean;
};

export function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  workspaceId,
  highlighted,
  onEdit,
  onDelete,
  isEditPending,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = comment.author?.id === currentUserId;
  const canDelete = canEdit || isAdmin;

  const handleEditSubmit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "group flex gap-3 rounded-md px-1 py-2",
        highlighted && "bg-primary/5 ring-1 ring-primary/20"
      )}
      id={`comment-${comment.id}`}
    >
      <Avatar className="mt-0.5 size-7 shrink-0 rounded-md">
        {comment.author?.image ? (
          <AvatarImage
            alt={comment.author.name ?? ""}
            src={comment.author.image}
          />
        ) : null}
        <AvatarFallback className="rounded-md text-[10px]">
          {initials(comment.author?.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {comment.author?.name ?? "Unknown"}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>
          {comment.updatedAt && (
            <span className="text-[10px] text-muted-foreground/70">
              (edited)
            </span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2">
            <CommentComposer
              initialContent={comment.content}
              isPending={isEditPending}
              onSubmit={handleEditSubmit}
              variant="compact"
              workspaceId={workspaceId}
            />
            <Button
              className="mt-1 h-6 text-xs"
              onClick={() => setIsEditing(false)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-foreground/90 text-sm leading-relaxed">
            {renderMarkdown(comment.content)}
          </p>
        )}
      </div>

      {(canEdit || canDelete) && !isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="mt-0.5 h-6 w-6 shrink-0 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
              size="sm"
              type="button"
              variant="ghost"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {canEdit && (
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 size-3.5" />
                Edit
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="mr-2 size-3.5" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
