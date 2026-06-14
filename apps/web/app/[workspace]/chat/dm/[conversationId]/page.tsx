"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { createMessage, getMessages, getThreads } from "@/lib/chat";
import { ChatHeader } from "../../_components/chat-header";
import { MessageComposer } from "../../_components/message-composer";
import { MessageList } from "../../_components/message-list";
import { findWorkspaceBySlug } from "@/lib/workspace";
import { toast } from "sonner";
import { attempt } from "@/lib/error-handling";

export default function DMPage() {
  const params = useParams();
  const slug = params.workspace as string;
  const conversationId = params.conversationId as string;
  const queryClient = useQueryClient();

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

  // Find DM details to display header
  const { data: threadsData } = useQuery({
    queryKey: ["chatThreads", workspaceId],
    queryFn: () => getThreads(workspaceId),
    enabled: !!workspaceId,
  });

  const dm = threadsData?.dms.find((d) => d.id === conversationId);
  const title =
    dm?.participants?.map((p) => p.name).join(", ") || "Unknown User";

  // Fetch messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ["chatMessages", workspaceId, conversationId],
    queryFn: () => getMessages(workspaceId, conversationId),
    enabled: !!workspaceId,
    refetchInterval: 5000, // Basic polling since websocket isn't set up yet
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      createMessage(workspaceId, conversationId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chatMessages", workspaceId, conversationId],
      });
    },
  });

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <ChatHeader title={title} type="dm" />

      <MessageList
        isLoading={isLoading}
        messages={messagesData?.messages || []}
      />

      <MessageComposer
        disabled={sendMessageMutation.isPending}
        onSendMessage={(content) => sendMessageMutation.mutate(content)}
        workspaceId={workspaceId}
      />
    </div>
  );
}
