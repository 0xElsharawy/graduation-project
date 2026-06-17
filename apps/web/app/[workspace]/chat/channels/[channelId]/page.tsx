"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { getMessages, getThreads } from "@/lib/chat";
import { attempt } from "@/lib/error-handling";
import { findWorkspaceBySlug, getWorkspaceMembers } from "@/lib/workspace";
import { useAuth } from "@/components/auth-provider";
import { ChatHeader } from "../../_components/chat-header";
import { MessageComposer } from "../../_components/message-composer";
import { MessageList } from "../../_components/message-list";
import { useChatSocket } from "@/hooks/use-chat-socket";

export default function ChannelPage() {
  const params = useParams();
  const slug = params.workspace as string;
  const channelId = params.channelId as string;
  const queryClient = useQueryClient();
  const { session } = useAuth();

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

  // Find channel details to display header
  const { data: threadsData } = useQuery({
    queryKey: ["chatThreads", workspaceId],
    queryFn: () => getThreads(workspaceId),
    enabled: !!workspaceId,
  });

  const channel = threadsData?.channels.find((c) => c.id === channelId);

  // Fetch workspace members to check permissions
  const { data: membersData } = useQuery({
    queryKey: ["workspaceMembers", workspaceId],
    queryFn: () => getWorkspaceMembers(workspaceId),
    enabled: !!workspaceId,
  });

  const currentMember = membersData?.data?.members?.find(
    (m) => m.userId === session?.user?.id,
  );
  const isAdmin = currentMember?.role === "admin";

  // Fetch messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ["chatMessages", workspaceId, channelId],
    queryFn: () => getMessages(workspaceId, channelId),
    enabled: !!workspaceId,
    // Real-time updates handled by websocket
  });

  const { sendMessage } = useChatSocket(workspaceId, channelId);

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendMessage(content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chatMessages", workspaceId, channelId],
      });
    },
  });

  return (
    <div className="flex h-full w-full flex-col">
      <ChatHeader
        isLocked={!!channel?.lockedAt}
        title={channel?.name || "..."}
        type="channel"
        workspaceId={workspaceId}
        channelId={channelId}
        visibility={channel?.visibility || "public"}
        isAdmin={isAdmin}
      />

      <MessageList
        isLoading={isLoading}
        messages={messagesData?.messages || []}
      />

      <MessageComposer
        disabled={!!channel?.lockedAt || sendMessageMutation.isPending}
        onSendMessage={(content) => sendMessageMutation.mutate(content)}
        workspaceId={workspaceId}
      />
    </div>
  );
}
