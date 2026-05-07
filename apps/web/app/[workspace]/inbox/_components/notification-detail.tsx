"use client";

import { format } from "date-fns";
import {
  ArrowUpDown,
  AtSign,
  CalendarClock,
  Crown,
  ExternalLink,
  Mail,
  MailOpen,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { InboxNotification, NotificationType } from "@/lib/inbox";
import { cn } from "@/lib/utils";
import {
  getNotificationSubject,
  getNotificationTitle,
} from "./notification-copy";

type NotificationDetailProps = {
  notification?: InboxNotification;
  workspaceSlug: string;
  isPending: boolean;
  onMarkRead: (notification: InboxNotification) => void;
  onMarkUnread: (notification: InboxNotification) => void;
  onDelete: (notification: InboxNotification) => void;
};

type TypeConfigEntry = {
  icon: React.ElementType;
  label: string;
  colorClass: string;
  accentClass: string;
};

const typeConfig: Record<NotificationType, TypeConfigEntry> = {
  task_assigned: {
    icon: UserCheck,
    label: "Assignment",
    colorClass: "text-emerald-500",
    accentClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  task_unassigned: {
    icon: UserX,
    label: "Unassigned",
    colorClass: "text-rose-500",
    accentClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  task_status_changed: {
    icon: RefreshCw,
    label: "Status Change",
    colorClass: "text-blue-500",
    accentClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  task_priority_changed: {
    icon: ArrowUpDown,
    label: "Priority Change",
    colorClass: "text-amber-500",
    accentClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  task_due_date_changed: {
    icon: CalendarClock,
    label: "Due Date",
    colorClass: "text-violet-500",
    accentClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  task_added_to_cycle: {
    icon: RotateCcw,
    label: "Added to Cycle",
    colorClass: "text-teal-500",
    accentClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  task_removed_from_cycle: {
    icon: RotateCw,
    label: "Removed from Cycle",
    colorClass: "text-orange-500",
    accentClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  project_lead_assigned: {
    icon: Crown,
    label: "Lead Assigned",
    colorClass: "text-yellow-500",
    accentClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  },
  task_comment_added: {
    icon: MessageSquare,
    label: "Comment",
    colorClass: "text-blue-500",
    accentClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  task_comment_mention: {
    icon: AtSign,
    label: "Mention",
    colorClass: "text-primary",
    accentClass: "bg-primary/10 text-primary",
  },
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function NotificationDetail({
  notification,
  workspaceSlug,
  isPending,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: NotificationDetailProps) {
  if (!notification) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="relative">
          <div className="flex size-14 items-center justify-center rounded-2xl border-2 border-muted-foreground/20 border-dashed bg-muted/20">
            <Mail className="size-6 text-muted-foreground/30" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-base tracking-tight">
            Nothing selected
          </p>
          <p className="max-w-[260px] text-muted-foreground text-sm leading-relaxed">
            Choose a notification from the list to see its details.
          </p>
        </div>
      </div>
    );
  }

  const config = typeConfig[notification.type] ?? {
    icon: RefreshCw,
    label: notification.type.replaceAll("_", " "),
    colorClass: "text-muted-foreground",
    accentClass: "bg-muted text-muted-foreground",
  };
  const TypeIcon = config.icon;

  const commentId =
    typeof notification.metadata?.commentId === "string"
      ? notification.metadata.commentId
      : null;
  const issueHref = notification.task
    ? `/${encodeURIComponent(workspaceSlug)}/projects/${notification.task.projectId}/issues/${notification.task.id}${commentId ? `?commentId=${commentId}` : ""}`
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/[0.04] px-5 py-2">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-[11px]",
              config.accentClass
            )}
          >
            <TypeIcon className="size-3" />
            {config.label}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/50">
            {format(new Date(notification.createdAt), "MMM d, yyyy · h:mm a")}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {notification.readAt ? (
            <Button
              className="h-7 gap-1.5 px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
              disabled={isPending}
              onClick={() => onMarkUnread(notification)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Mail className="size-3.5" />
              Mark unread
            </Button>
          ) : (
            <Button
              className="h-7 gap-1.5 px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
              disabled={isPending}
              onClick={() => onMarkRead(notification)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <MailOpen className="size-3.5" />
              Mark read
            </Button>
          )}
          <Button
            className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-destructive"
            disabled={isPending}
            onClick={() => onDelete(notification)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-2xl px-8 py-10">
          {/* Actor row */}
          <div className="flex items-center gap-3">
            <Avatar className="size-9 rounded-lg ring-1 ring-border/60">
              {notification.actor?.image ? (
                <AvatarImage
                  alt={notification.actor.name}
                  src={notification.actor.image}
                />
              ) : null}
              <AvatarFallback className="rounded-lg font-medium text-xs">
                {initials(notification.actor?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm leading-none">
                {notification.actor?.name ?? "System"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                {format(
                  new Date(notification.createdAt),
                  "EEEE, MMMM d 'at' h:mm a"
                )}
              </p>
            </div>
            {!notification.readAt && (
              <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 font-semibold text-[10px] text-primary-foreground uppercase tracking-wider">
                New
              </span>
            )}
          </div>

          {/* Subject */}
          <h1 className="mt-7 font-bold text-[1.6rem] text-foreground leading-snug tracking-tight">
            {getNotificationSubject(notification)}
          </h1>

          {/* Body */}
          <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
            {getNotificationTitle(notification)}
          </p>

          {/* Divider */}
          <div className="mt-8 h-px bg-border/50" />

          {/* Metadata */}
          <div className="mt-5 space-y-0">
            <div className="flex items-center justify-between border-border/40 border-b py-2.5">
              <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                Type
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-0.5 font-medium text-[11px]",
                  config.accentClass
                )}
              >
                <TypeIcon className="size-3" />
                {config.label}
              </span>
            </div>

            {notification.project ? (
              <div className="flex items-center justify-between border-border/40 border-b py-2.5">
                <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                  Project
                </span>
                <span className="font-medium text-sm">
                  {notification.project.name}
                </span>
              </div>
            ) : null}

            {notification.task ? (
              <div className="flex items-center justify-between border-border/40 border-b py-2.5">
                <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                  Issue
                </span>
                <span className="max-w-[320px] truncate text-right font-medium text-sm">
                  {notification.task.name}
                </span>
              </div>
            ) : null}
          </div>

          {/* CTA */}
          {issueHref ? (
            <div className="mt-8">
              <Button asChild className="gap-2 rounded-lg">
                <Link href={issueHref}>
                  Open issue
                  <ExternalLink className="size-3.5" />
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
