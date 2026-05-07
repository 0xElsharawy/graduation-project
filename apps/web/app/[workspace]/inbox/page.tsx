"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import {
  deleteNotification,
  deleteReadNotifications,
  type InboxNotification,
  listInboxNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
} from "@/lib/inbox";
import { findWorkspaceBySlug } from "@/lib/workspace";
import { InboxActions } from "./_components/inbox-actions";
import { NotificationDetail } from "./_components/notification-detail";
import { NotificationEmpty } from "./_components/notification-empty";
import { NotificationList } from "./_components/notification-list";

export default function InboxPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const slug = decodeURIComponent(params.workspace as string);
  const [selectedId, setSelectedId] = useState<string>();

  const { data: workspaceData, isLoading: isWorkspaceLoading } = useQuery({
    queryKey: ["workspace", slug],
    enabled: !!slug,
    queryFn: async () => {
      const result = await findWorkspaceBySlug(slug);
      return result.data.workspace;
    },
  });

  const workspaceId = workspaceData?.id;

  const inboxQuery = useQuery({
    queryKey: ["inbox", workspaceId],
    enabled: !!workspaceId,
    refetchInterval: 15_000,
    queryFn: async () => {
      const result = await listInboxNotifications(workspaceId ?? "");
      return result.data.notifications;
    },
  });

  const notifications = inboxQuery.data ?? [];
  const unreadCount = notifications.filter(
    (notification) => !notification.readAt
  ).length;
  const readCount = notifications.length - unreadCount;
  const selectedNotification = useMemo(
    () => notifications.find((notification) => notification.id === selectedId),
    [notifications, selectedId]
  );

  const invalidateInbox = () => {
    queryClient.invalidateQueries({ queryKey: ["inbox", workspaceId] });
    queryClient.invalidateQueries({ queryKey: ["inbox-count", workspaceId] });
  };

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!workspaceId) {
        throw new Error("No workspace selected");
      }
      return await markNotificationRead(workspaceId, notificationId);
    },
    onSuccess: invalidateInbox,
    onError: () => toast.error("Failed to mark notification read"),
  });

  const markUnreadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!workspaceId) {
        throw new Error("No workspace selected");
      }
      return await markNotificationUnread(workspaceId, notificationId);
    },
    onSuccess: invalidateInbox,
    onError: () => toast.error("Failed to mark notification unread"),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) {
        throw new Error("No workspace selected");
      }
      return await markAllNotificationsRead(workspaceId);
    },
    onSuccess: () => {
      invalidateInbox();
      toast.success("Inbox marked as read");
    },
    onError: () => toast.error("Failed to mark inbox read"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!workspaceId) {
        throw new Error("No workspace selected");
      }
      return await deleteNotification(workspaceId, notificationId);
    },
    onSuccess: (_, notificationId) => {
      setSelectedId((current) =>
        current === notificationId ? undefined : current
      );
      invalidateInbox();
    },
    onError: () => toast.error("Failed to delete notification"),
  });

  const deleteReadMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) {
        throw new Error("No workspace selected");
      }
      return await deleteReadNotifications(workspaceId);
    },
    onSuccess: () => {
      setSelectedId(undefined);
      invalidateInbox();
      toast.success("Read notifications cleared");
    },
    onError: () => toast.error("Failed to clear read notifications"),
  });

  useEffect(() => {
    if (
      selectedId &&
      notifications.some((notification) => notification.id === selectedId)
    ) {
      return;
    }

    setSelectedId(notifications[0]?.id);
  }, [notifications, selectedId]);

  const handleSelect = (notification: InboxNotification) => {
    setSelectedId(notification.id);
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id);
    }
  };

  const isMutating =
    markReadMutation.isPending ||
    markUnreadMutation.isPending ||
    markAllReadMutation.isPending ||
    deleteMutation.isPending ||
    deleteReadMutation.isPending;

  if (isWorkspaceLoading || inboxQuery.isLoading) {
    return <Loading />;
  }

  if (!workspaceId) {
    return <NotificationEmpty />;
  }

  return (
    <main className="flex h-[calc(100vh-3rem)] min-h-0 flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted/50">
            <Inbox className="size-3.5 text-muted-foreground" />
          </div>
          <h1 className="font-semibold text-sm tracking-tight">Inbox</h1>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-primary px-1.5 py-0.5 font-mono font-semibold text-[10px] text-primary-foreground">
              {unreadCount}
            </span>
          ) : (
            <span className="font-mono text-[10px] text-muted-foreground/40">
              {notifications.length}
            </span>
          )}
        </div>
        <InboxActions
          isPending={isMutating}
          onClearRead={() => deleteReadMutation.mutate()}
          onMarkAllRead={() => markAllReadMutation.mutate()}
          readCount={readCount}
          unreadCount={unreadCount}
        />
      </header>

      {notifications.length === 0 ? (
        <NotificationEmpty />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[340px_minmax(0,1fr)]">
          <aside className="min-h-0 border-r">
            <NotificationList
              notifications={notifications}
              onSelect={handleSelect}
              selectedId={selectedId}
            />
          </aside>
          <section className="min-h-0">
            <NotificationDetail
              isPending={isMutating}
              notification={selectedNotification}
              onDelete={(notification) =>
                deleteMutation.mutate(notification.id)
              }
              onMarkRead={(notification) =>
                markReadMutation.mutate(notification.id)
              }
              onMarkUnread={(notification) =>
                markUnreadMutation.mutate(notification.id)
              }
              workspaceSlug={slug}
            />
          </section>
        </div>
      )}
    </main>
  );
}
