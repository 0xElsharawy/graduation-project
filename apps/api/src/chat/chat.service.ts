import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { ok } from "@/common/response";
import { db } from "@/db";
import {
  channelMembers,
  chatChannels,
  chatMessages,
  messageReactions,
  messageReads,
  users,
} from "@/db/schema";
import { attempt } from "@/lib/error-handling";

@Injectable()
export class ChatService {
  private channelScope(workspaceId: string) {
    return eq(chatChannels.workspaceId, workspaceId);
  }

  async listChannels(workspaceId: string, userId: string) {
    const [channels, error] = await attempt(
      db
        .select({
          id: chatChannels.id,
          name: chatChannels.name,
          description: chatChannels.description,
          isPublic: chatChannels.isPublic,
          createdAt: chatChannels.createdAt,
          createdBy: chatChannels.createdBy,
        })
        .from(chatChannels)
        .where(this.channelScope(workspaceId))
        .orderBy(desc(chatChannels.createdAt))
        .limit(500)
    );

    if (error) {
      throw new InternalServerErrorException("Failed to list channels");
    }

    return ok({ channels: channels ?? [] });
  }

  async createChannel(workspaceId: string, userId: string, body: any) {
    const [channel, error] = await attempt(
      db
        .insert(chatChannels)
        .values({
          workspaceId,
          name: body.name,
          description: body.description ?? null,
          isPublic: body.isPublic ?? true,
          createdBy: userId,
        })
        .returning({ id: chatChannels.id })
    );

    if (error) {
      throw new InternalServerErrorException("Failed to create channel");
    }

    return ok({ channelId: channel?.[0]?.id });
  }

  async listMessages(workspaceId: string, channelId: string) {
    const [messages, error] = await attempt(
      db
        .select({
          id: chatMessages.id,
          content: chatMessages.content,
          sender: { id: users.id, name: users.name, image: users.image },
          createdAt: chatMessages.createdAt,
          parentMessageId: chatMessages.parentMessageId,
        })
        .from(chatMessages)
        .leftJoin(users, eq(chatMessages.senderId, users.id))
        .where(and(eq(chatMessages.channelId, channelId)))
        .orderBy(desc(chatMessages.createdAt))
        .limit(100)
    );

    if (error) {
      throw new InternalServerErrorException("Failed to list messages");
    }

    return ok({ messages: messages ?? [] });
  }

  async postMessage(
    workspaceId: string,
    channelId: string,
    userId: string,
    body: any
  ) {
    const [message, error] = await attempt(
      db
        .insert(chatMessages)
        .values({
          channelId,
          senderId: userId,
          content: body.content,
          parentMessageId: body.parentMessageId ?? null,
        })
        .returning({ id: chatMessages.id })
    );

    if (error) {
      throw new InternalServerErrorException("Failed to post message");
    }

    return ok({ messageId: message?.[0]?.id });
  }

  async listMembers(workspaceId: string, channelId: string) {
    const [members, error] = await attempt(
      db
        .select({ id: users.id, name: users.name, image: users.image })
        .from(channelMembers)
        .leftJoin(users, eq(channelMembers.userId, users.id))
        .where(eq(channelMembers.channelId, channelId))
        .limit(500)
    );

    if (error) {
      throw new InternalServerErrorException("Failed to list members");
    }

    return ok({ members: members ?? [] });
  }

  async addMember(
    workspaceId: string,
    channelId: string,
    actorId: string,
    userId: string
  ) {
    const [member, error] = await attempt(
      db
        .insert(channelMembers)
        .values({ channelId, userId })
        .returning({ id: channelMembers.id })
    );

    if (error) {
      throw new InternalServerErrorException("Failed to add member");
    }

    return ok({ memberId: member?.[0]?.id });
  }

  async removeMember(
    workspaceId: string,
    channelId: string,
    actorId: string,
    userId: string
  ) {
    const [deleted, error] = await attempt(
      db
        .delete(channelMembers)
        .where(
          and(
            eq(channelMembers.channelId, channelId),
            eq(channelMembers.userId, userId)
          )
        )
        .returning({ id: channelMembers.id })
    );

    if (error) {
      throw new InternalServerErrorException("Failed to remove member");
    }

    return ok({ memberId: deleted?.[0]?.id ?? null });
  }

  async addReaction(
    workspaceId: string,
    messageId: string,
    userId: string,
    emoji: string
  ) {
    const [reaction, error] = await attempt(
      db
        .insert(messageReactions)
        .values({ messageId, userId, emoji })
        .returning({ id: messageReactions.id })
    );

    if (error) {
      throw new InternalServerErrorException("Failed to add reaction");
    }

    return ok({ reactionId: reaction?.[0]?.id });
  }

  async removeReaction(
    workspaceId: string,
    messageId: string,
    userId: string,
    emoji: string
  ) {
    const [deleted, error] = await attempt(
      db
        .delete(messageReactions)
        .where(
          and(
            eq(messageReactions.messageId, messageId),
            eq(messageReactions.userId, userId),
            eq(messageReactions.emoji, emoji)
          )
        )
        .returning({ id: messageReactions.id })
    );

    if (error) {
      throw new InternalServerErrorException("Failed to remove reaction");
    }

    return ok({ reactionId: deleted?.[0]?.id ?? null });
  }

  async markRead(workspaceId: string, messageId: string, userId: string) {
    const [read, error] = await attempt(
      db
        .insert(messageReads)
        .values({ messageId, userId })
        .returning({ id: messageReads.id })
    );

    if (error) {
      throw new InternalServerErrorException("Failed to mark message read");
    }

    return ok({ readId: read?.[0]?.id });
  }
}
