"use client";

import { isThisWeek, isToday, isYesterday } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { InboxNotification } from "@/lib/inbox";
import { NotificationItem } from "./notification-item";

type NotificationListProps = {
  notifications: InboxNotification[];
  selectedId?: string;
  onSelect: (notification: InboxNotification) => void;
};

type GroupKey = "Today" | "Yesterday" | "This Week" | "Earlier";

const GROUP_ORDER: GroupKey[] = ["Today", "Yesterday", "This Week", "Earlier"];

function getGroup(dateStr: string): GroupKey {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date, { weekStartsOn: 1 })) return "This Week";
  return "Earlier";
}

export function NotificationList({
  notifications,
  selectedId,
  onSelect,
}: NotificationListProps) {
  const grouped = notifications.reduce<Record<GroupKey, InboxNotification[]>>(
    (acc, notification) => {
      const group = getGroup(notification.createdAt);
      if (!acc[group]) acc[group] = [];
      acc[group].push(notification);
      return acc;
    },
    { Today: [], Yesterday: [], "This Week": [], Earlier: [] }
  );

  const activeGroups = GROUP_ORDER.filter((g) => grouped[g].length > 0);

  return (
    <ScrollArea className="h-full">
      <div className="min-h-full">
        {activeGroups.map((group) => (
          <div key={group}>
            <div className="sticky top-0 z-10 border-border/40 border-b bg-background/90 px-4 py-1.5 backdrop-blur-sm">
              <span className="font-mono font-semibold text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                {group}
              </span>
            </div>
            {grouped[group].map((notification) => (
              <NotificationItem
                isSelected={notification.id === selectedId}
                key={notification.id}
                notification={notification}
                onSelect={onSelect}
              />
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
