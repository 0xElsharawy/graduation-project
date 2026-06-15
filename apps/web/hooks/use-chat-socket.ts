import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { chatSocket } from "@/lib/socket";

export function useChatSocket(workspaceId: string, threadId: string) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(chatSocket.connected);

  useEffect(() => {
    if (!(threadId && workspaceId)) {
      return;
    }

    function onConnect() {
      setIsConnected(true);
      chatSocket.emit("joinThread", { threadId });
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    const handleMessageEvent = () => {
      queryClient.invalidateQueries({
        queryKey: ["chatMessages", workspaceId, threadId],
      });
    };

    if (chatSocket.connected) {
      onConnect();
    } else {
      chatSocket.connect();
    }

    chatSocket.on("connect", onConnect);
    chatSocket.on("disconnect", onDisconnect);
    chatSocket.on("messageCreated", handleMessageEvent);
    chatSocket.on("messageUpdated", handleMessageEvent);
    chatSocket.on("messageDeleted", handleMessageEvent);

    return () => {
      chatSocket.emit("leaveThread", { threadId });
      chatSocket.off("connect", onConnect);
      chatSocket.off("disconnect", onDisconnect);
      chatSocket.off("messageCreated", handleMessageEvent);
      chatSocket.off("messageUpdated", handleMessageEvent);
      chatSocket.off("messageDeleted", handleMessageEvent);
    };
  }, [workspaceId, threadId, queryClient]);

  const sendMessage = async (content: string) => {
    if (!chatSocket.connected) {
      chatSocket.connect();
    }

    return await new Promise((resolve, reject) => {
      chatSocket.emit(
        "sendMessage",
        { workspaceId, threadId, content },
        (response: any) => {
          if (response?.event === "error") {
            reject(new Error(response.error || "Failed to send message"));
          } else {
            resolve(response?.data);
          }
        }
      );
    });
  };

  return { sendMessage, isConnected };
}
