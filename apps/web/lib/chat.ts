import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";

export type UserSnippet = {
  id: string;
  name: string | null;
  image: string | null;
};

export type ThreadSummary = {
  id: string;
  type: "channel" | "dm";
  name?: string | null;
  visibility?: "public" | "private" | null;
  participants?: UserSnippet[];
  lockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creator: UserSnippet;
};

export type MessageAttachment = {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: Date;
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string | null;
  sender: UserSnippet | null;
  content: string | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  attachments: MessageAttachment[];
};

export type CreateChannelDto = {
  name: string;
  visibility?: "public" | "private";
};

export type CreateDmDto = {
  userId: string;
};

export type CreateMessageDto = {
  content: string;
};

export async function getThreads(workspaceId: string) {
  const { data } = await authFetch<{
    channels: ThreadSummary[];
    dms: ThreadSummary[];
  }>(`${BACKEND_URL}/workspaces/${workspaceId}/chat/threads`);
  return data.data;
}

export async function createChannel(
  workspaceId: string,
  dto: CreateChannelDto
) {
  const { data } = await authFetch<{ channelId: string; threadId: string }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/chat/channels`,
    { method: "POST", data: dto }
  );
  return data;
}

export async function createDm(workspaceId: string, dto: CreateDmDto) {
  const { data } = await authFetch<{
    conversationId: string;
    threadId: string;
  }>(`${BACKEND_URL}/workspaces/${workspaceId}/chat/dm`, {
    method: "POST",
    data: dto,
  });
  return data.data;
}

export async function getMessages(workspaceId: string, threadId: string) {
  const { data } = await authFetch<{ threadId: string; messages: Message[] }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/chat/threads/${threadId}/messages`
  );
  return data.data;
}

export async function createMessage(
  workspaceId: string,
  threadId: string,
  dto: CreateMessageDto
) {
  const { data } = await authFetch<{
    messageId: string;
    threadId: string;
    createdAt: Date;
  }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/chat/threads/${threadId}/messages`,
    { method: "POST", data: dto }
  );
  return data.data;
}

export async function deleteMessage(workspaceId: string, messageId: string) {
  const { data } = await authFetch<{ messageId: string }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/chat/messages/${messageId}`,
    { method: "DELETE" }
  );
  return data.data;
}

export async function deleteChannel(workspaceId: string, channelId: string) {
  const { data } = await authFetch<{ channelId: string }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/chat/channels/${channelId}`,
    { method: "DELETE" }
  );
  return data.data;
}

export type UpdateChannelDto = {
  name?: string;
  description?: string;
  visibility?: "public" | "private";
};

export async function updateChannel(
  workspaceId: string,
  channelId: string,
  dto: UpdateChannelDto
) {
  const { data } = await authFetch<{ channelId: string }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/chat/channels/${channelId}`,
    { method: "PATCH", data: dto }
  );
  return data.data;
}

