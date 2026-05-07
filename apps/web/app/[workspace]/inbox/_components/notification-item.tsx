"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ArrowUpDown,
  AtSign,
  CalendarClock,
  Crown,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  RotateCw,
  UserCheck,
  UserX,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { InboxNotification, NotificationType } from "@/lib/inbox";
import { cn } from "@/lib/utils";
import { getNotificationTitle } from "./notification-copy";

type NotificationItemProps = {
  notification: InboxNotification;
  isSelected: boolean;
  onSelect: (notification: InboxNotification) => void;
};

export const typeConfig: Record<
  NotificationType,
  { icon: React.ElementType; color: string; dot: string }
> = {
  task_assigned: {
    icon: UserCheck,
    color: "text-emerald-500",
    dot: "bg-emerald-500",
  },
  task_unassigned: {
    icon: UserX,
    color: "text-rose-500",
    dot: "bg-rose-500",
  },
  task_status_changed: {
    icon: RefreshCw,
    color: "text-blue-500",
    dot: "bg-blue-500",
  },
  task_priority_changed: {
    icon: ArrowUpDown,
    color: "text-amber-500",
    dot: "bg-amber-500",
  },
  task_due_date_changed: {
    icon: CalendarClock,
    color: "text-violet-500",
    dot: "bg-violet-500",
  },
  task_added_to_cycle: {
    icon: RotateCcw,
    color: "text-teal-500",
    dot: "bg-teal-500",
  },
  task_removed_from_cycle: {
    icon: RotateCw,
    color: "text-orange-500",
    dot: "bg-orange-500",
  },
  project_lead_assigned: {
    icon: Crown,
    color: "text-yellow-500",
    dot: "bg-yellow-500",
  },
  task_comment_added: {
    icon: MessageSquare,
    color: "text-blue-500",
    dot: "bg-blue-500",
  },
  task_comment_mention: {
    icon: AtSign,
    color: "text-primary",
    dot: "bg-primary",
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

export function NotificationItem({
  notification,
  isSelected,
  onSelect,
}: NotificationItemProps) {
  const isUnread = !notification.readAt;
  const config = typeConfig[notification.type] ?? {
    icon: RefreshCw,
    color: "text-muted-foreground",
    dot: "bg-muted-foreground",
  };
  const TypeIcon = config.icon;

  return (
    <button
      className={cn(
        "group relative flex w-full gap-3 px-4 py-3.5 text-left",
        "border-border/50 border-b transition-colors duration-100",
        "hover:bg-muted/40",
        isSelected && "bg-muted/60",
        isUnread && !isSelected && "bg-primary/[0.03]"
      )}
      onClick={() => onSelect(notification)}
      type="button"
    >
      {/* Unread accent stripe */}
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-[2px] rounded-r-full transition-opacity duration-150",
          isUnread ? "opacity-100" : "opacity-0",
          config.dot
        )}
      />

      {/* Avatar with type badge */}
      <div className="relative mt-0.5 shrink-0">
        <Avatar className="size-8 rounded-md">
          {notification.actor?.image ? (
            <AvatarImage
              alt={notification.actor.name}
              src={notification.actor.image}
            />
          ) : null}
          <AvatarFallback className="rounded-md font-medium text-xs">
            {initials(notification.actor?.name)}
          </AvatarFallback>
        </Avatar>
        <span className="-bottom-0.5 -right-0.5 absolute flex size-3.5 items-center justify-center rounded-full border border-background bg-background shadow-sm">
          <TypeIcon className={cn("size-2.5", config.color)} />
        </span>
      </div>

      {/* Content */}
      <span className="min-w-0 flex-1 pl-0.5">
        <span className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "line-clamp-2 flex-1 text-sm leading-[1.45]",
              isUnread
                ? "font-[500] text-foreground"
                : "font-normal text-muted-foreground"
            )}
          >
            {getNotificationTitle(notification)}
          </span>
          {isUnread && (
            <span
              className={cn(
                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                config.dot
              )}
            />
          )}
        </span>
        <span className="mt-1 block font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </span>
      </span>
    </button>
  );
}
