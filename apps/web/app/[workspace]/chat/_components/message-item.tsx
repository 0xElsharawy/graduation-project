import { format } from "date-fns";
import { IconHash } from "@tabler/icons-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Message } from "@/lib/chat";

// Syntax: #[Task Name](projectId:taskId)
const TASK_MENTION_REGEX = /#\[([^\]]+)\]\(([^:)]+):([^)]+)\)/g;

function renderContent(text: string, workspaceSlug: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(TASK_MENTION_REGEX)) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      parts.push(<span key={key++}>{before}</span>);
    }

    const taskName = match[1];
    const projectId = match[2];
    const taskId = match[3];
    const href = `/${workspaceSlug}/projects/${projectId}/issues/${taskId}`;

    parts.push(
      <Link
        key={`task-${key++}`}
        href={href}
        className="group/chip inline-flex items-center gap-1 rounded border-l-2 border-primary bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary/80 transition-colors hover:bg-primary/20 hover:text-primary"
        title={`Go to task: ${taskName}`}
      >
        <IconHash
          size={10}
          className="shrink-0 text-primary/60 transition-colors group-hover/chip:text-primary"
        />
        <span className="truncate">{taskName}</span>
      </Link>
    );

    lastIndex = (match.index ?? 0) + match[0].length;
  }

  const remaining = text.slice(lastIndex);
  if (remaining) {
    parts.push(<span key={key++}>{remaining}</span>);
  }

  return parts;
}

export function MessageItem({ message }: { message: Message }) {
  const isDeleted = !!message.deletedAt;
  const isEdited = !!message.editedAt && !isDeleted;
  const params = useParams();
  const workspaceSlug = params.workspace as string;

  return (
    <div className="group flex gap-4 border-transparent border-l-4 p-4 transition-colors hover:border-primary hover:bg-muted/40">
      <div className="mt-1 flex-shrink-0">
        {message.sender?.image ? (
          <img
            alt={message.sender.name || "User"}
            className="h-10 w-10 rounded-full border border-border bg-muted object-cover"
            src={message.sender.image}
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted font-bold font-mono text-muted-foreground">
            {message.sender?.name?.charAt(0).toUpperCase() || "?"}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="truncate font-bold font-mono text-foreground">
            {message.sender?.name || "Unknown User"}
          </span>
          <span className="font-mono text-muted-foreground/70 text-xs">
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
        </div>

        <div className="whitespace-pre-wrap break-words font-sans text-foreground/90 leading-relaxed">
          {isDeleted ? (
            <span className="text-muted-foreground/60 italic line-through">
              Message deleted
            </span>
          ) : (
            renderContent(message.content ?? "", workspaceSlug)
          )}
          {isEdited && (
            <span className="ml-2 font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest">
              (edited)
            </span>
          )}
        </div>

        {!isDeleted &&
          message.attachments &&
          message.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.attachments.map((attachment) => (
                <a
                  className="flex items-center gap-2 rounded border border-border bg-card p-2 font-mono text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                  href={attachment.fileUrl}
                  key={attachment.id}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="max-w-[200px] truncate">
                    {attachment.fileName}
                  </span>
                </a>
              ))}
            </div>
          )}
      </div>

      <div className="flex gap-2 opacity-0 transition-none group-hover:opacity-100">
        {/* Actions like Edit/Delete could go here for own messages */}
      </div>
    </div>
  );
}
