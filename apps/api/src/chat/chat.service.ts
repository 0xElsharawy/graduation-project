import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { ok } from "@/common/response";
import { db } from "@/db";
import {
  chatMessageAttachments,
  chatMessages,
  chatThreads,
  chatThreadMembers,
  users,
  workspaceMembers,
} from "@/db/schema";
import { attempt } from "@/lib/error-handling";
import type { CreateChannelDto } from "./dto/create-channel.dto";
import type { CreateDmDto } from "./dto/create-dm.dto";
import type { CreateMessageDto } from "./dto/create-message.dto";
import type { UpdateChannelDto } from "./dto/update-channel.dto";
import type { UpdateMessageDto } from "./dto/update-message.dto";
import type { UploadAttachmentDto } from "./dto/upload-attachment.dto";

type ThreadSummary = {
  id: string;
  type: "channel" | "dm";
  name: string | null;
  visibility: "public" | "private" | null;
  lockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string | null;
  creatorName: string | null;
  creatorImage: string | null;
  memberId: string | null;
};

@Injectable()
export class ChatService {
  private async getWorkspaceMembership(workspaceId: string, userId: string) {
    const [membership, error] = await attempt(
      db
        .select({ role: workspaceMembers.role })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId)
          )
        )
        .limit(1)
    );
    if (error) {
      throw new InternalServerErrorException("Failed to check workspace access");
    }
    if (!membership?.[0]) {
      throw new ForbiddenException("Not a member of this workspace");
    }
    return membership[0];
  }

  private async isWorkspaceAdmin(workspaceId: string, userId: string) {
    const membership = await this.getWorkspaceMembership(workspaceId, userId);
    return membership.role === "admin";
  }

  private async getThread(workspaceId: string, threadId: string) {
    const [thread, error] = await attempt(
      db
        .select({
          id: chatThreads.id,
          workspaceId: chatThreads.workspaceId,
          type: chatThreads.type,
          name: chatThreads.name,
          visibility: chatThreads.visibility,
          dmKey: chatThreads.dmKey,
          lockedAt: chatThreads.lockedAt,
          archivedAt: chatThreads.archivedAt,
          createdAt: chatThreads.createdAt,
          updatedAt: chatThreads.updatedAt,
        })
        .from(chatThreads)
        .where(
          and(
            eq(chatThreads.workspaceId, workspaceId),
            eq(chatThreads.id, threadId)
          )
        )
        .limit(1)
    );
    if (error) {
      throw new InternalServerErrorException("Failed to load thread");
    }
    if (!thread?.[0] || thread[0].archivedAt) {
      throw new NotFoundException("Thread not found");
    }
    return thread[0];
  }

  private async getThreadMember(threadId: string, userId: string) {
    const [member, error] = await attempt(
      db
        .select({ id: chatThreadMembers.id })
        .from(chatThreadMembers)
        .where(
          and(
            eq(chatThreadMembers.threadId, threadId),
            eq(chatThreadMembers.userId, userId)
          )
        )
        .limit(1)
    );
    if (error) {
      throw new InternalServerErrorException("Failed to check thread access");
    }
    return member?.[0] ?? null;
  }

  private async ensureThreadAccess(
    workspaceId: string,
    threadId: string,
    userId: string
  ) {
    const thread = await this.getThread(workspaceId, threadId);
    await this.getWorkspaceMembership(workspaceId, userId);

    if (thread.type === "channel" && thread.visibility === "public") {
      return thread;
    }

    const member = await this.getThreadMember(thread.id, userId);
    if (!member) {
      throw new ForbiddenException("You do not have access to this thread");
    }

    return thread;
  }

  private async ensureAdminChannelAccess(
    workspaceId: string,
    channelId: string,
    userId: string
  ) {
    const thread = await this.getThread(workspaceId, channelId);
    if (thread.type !== "channel") {
      throw new NotFoundException("Channel not found");
    }

    const admin = await this.isWorkspaceAdmin(workspaceId, userId);
    if (!admin) {
      throw new ForbiddenException("You are not authorized to manage channels");
    }

    return thread;
  }

  private normalizeDmKey(userA: string, userB: string) {
    return [userA, userB].sort().join(":");
  }

  private async loadMessageAttachments(messageIds: string[]) {
    if (messageIds.length === 0) {
      return new Map<
        string,
        {
          id: string;
          fileUrl: string;
          fileName: string;
          fileType: string;
          fileSize: number;
          createdAt: Date;
        }[]
      >();
    }

    const [attachments, error] = await attempt(
      db
        .select({
          id: chatMessageAttachments.id,
          messageId: chatMessageAttachments.messageId,
          fileUrl: chatMessageAttachments.fileUrl,
          fileName: chatMessageAttachments.fileName,
          fileType: chatMessageAttachments.fileType,
          fileSize: chatMessageAttachments.fileSize,
          createdAt: chatMessageAttachments.createdAt,
        })
        .from(chatMessageAttachments)
        .where(inArray(chatMessageAttachments.messageId, messageIds))
        .orderBy(asc(chatMessageAttachments.createdAt))
    );
    if (error) {
      throw new InternalServerErrorException("Failed to load attachments");
    }

    const byMessageId = new Map<
      string,
      {
        id: string;
        fileUrl: string;
        fileName: string;
        fileType: string;
        fileSize: number;
        createdAt: Date;
      }[]
    >();

    for (const attachment of attachments ?? []) {
      const list = byMessageId.get(attachment.messageId) ?? [];
      list.push({
        id: attachment.id,
        fileUrl: attachment.fileUrl,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        createdAt: attachment.createdAt,
      });
      byMessageId.set(attachment.messageId, list);
    }

    return byMessageId;
  }

  async listThreads(workspaceId: string, userId: string) {
    await this.getWorkspaceMembership(workspaceId, userId);

    const [rows, error] = await attempt(
      db
        .select({
          id: chatThreads.id,
          type: chatThreads.type,
          name: chatThreads.name,
          visibility: chatThreads.visibility,
          lockedAt: chatThreads.lockedAt,
          createdAt: chatThreads.createdAt,
          updatedAt: chatThreads.updatedAt,
          creatorId: chatThreads.createdById,
          creatorName: users.name,
          creatorImage: users.image,
          memberId: chatThreadMembers.id,
        })
        .from(chatThreads)
        .leftJoin(users, eq(chatThreads.createdById, users.id))
        .leftJoin(
          chatThreadMembers,
          and(
            eq(chatThreadMembers.threadId, chatThreads.id),
            eq(chatThreadMembers.userId, userId)
          )
        )
        .where(
          and(
            eq(chatThreads.workspaceId, workspaceId),
            isNull(chatThreads.archivedAt)
          )
        )
        .orderBy(desc(chatThreads.updatedAt), desc(chatThreads.createdAt))
    );
    if (error) {
      throw new InternalServerErrorException("Failed to list threads");
    }

    const allThreads = (rows ?? []) as ThreadSummary[];

    const channels = allThreads
      .filter(
        (thread) =>
          thread.type === "channel" &&
          (thread.visibility === "public" || thread.memberId !== null)
      )
      .map((thread) => ({
        id: thread.id,
        type: thread.type,
        name: thread.name,
        visibility: thread.visibility,
        lockedAt: thread.lockedAt,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        creator: {
          id: thread.creatorId,
          name: thread.creatorName,
          image: thread.creatorImage,
        },
      }));

    const dmThreads = allThreads.filter(
      (thread) => thread.type === "dm" && thread.memberId !== null
    );
    const dmIds = dmThreads.map((thread) => thread.id);
    const dmParticipantsByThread = new Map<
      string,
      { id: string; name: string | null; image: string | null }[]
    >();

    if (dmIds.length > 0) {
      const [members, membersError] = await attempt(
        db
          .select({
            threadId: chatThreadMembers.threadId,
            userId: users.id,
            name: users.name,
            image: users.image,
          })
          .from(chatThreadMembers)
          .leftJoin(users, eq(chatThreadMembers.userId, users.id))
          .where(
            and(
              eq(chatThreadMembers.workspaceId, workspaceId),
              inArray(chatThreadMembers.threadId, dmIds)
            )
          )
          .orderBy(asc(chatThreadMembers.joinedAt))
      );
      if (membersError) {
        throw new InternalServerErrorException("Failed to load DM members");
      }

      for (const member of members ?? []) {
        if (!member.userId || !member.name) {
          continue;
        }
        if (member.userId === userId) {
          continue;
        }
        const list = dmParticipantsByThread.get(member.threadId) ?? [];
        list.push({ id: member.userId, name: member.name, image: member.image });
        dmParticipantsByThread.set(member.threadId, list);
      }
    }

    const dms = dmThreads.map((thread) => ({
      id: thread.id,
      type: thread.type,
      participants: dmParticipantsByThread.get(thread.id) ?? [],
      lockedAt: thread.lockedAt,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      creator: {
        id: thread.creatorId,
        name: thread.creatorName,
        image: thread.creatorImage,
      },
    }));

    return ok({ channels, dms });
  }

  async listChannels(workspaceId: string, userId: string) {
    const result = await this.listThreads(workspaceId, userId);
    return ok({ channels: result.data.channels });
  }

  async createChannel(
    workspaceId: string,
    userId: string,
    dto: CreateChannelDto
  ) {
    await this.getWorkspaceMembership(workspaceId, userId);

    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException("Channel name cannot be empty");
    }

    const [created, error] = await attempt(
      db
        .insert(chatThreads)
        .values({
          workspaceId,
          type: "channel",
          name,
          visibility: dto.visibility ?? "public",
          createdById: userId,
        })
        .returning({ id: chatThreads.id })
    );
    if (error || !created?.[0]) {
      throw new InternalServerErrorException("Failed to create channel");
    }

    const threadId = created[0].id;
    const [, membershipError] = await attempt(
      db.insert(chatThreadMembers).values({
        workspaceId,
        threadId,
        userId,
      })
    );
    if (membershipError) {
      throw new InternalServerErrorException("Failed to add channel creator");
    }

    return ok({ channelId: threadId, threadId });
  }

  async updateChannel(
    workspaceId: string,
    channelId: string,
    userId: string,
    dto: UpdateChannelDto
  ) {
    const thread = await this.ensureAdminChannelAccess(
      workspaceId,
      channelId,
      userId
    );

    const updates: {
      name?: string;
      visibility?: "public" | "private";
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException("Channel name cannot be empty");
      }
      updates.name = name;
    }

    if (dto.visibility !== undefined) {
      updates.visibility = dto.visibility;
    }

    const [, error] = await attempt(
      db
        .update(chatThreads)
        .set(updates)
        .where(eq(chatThreads.id, thread.id))
    );
    if (error) {
      throw new InternalServerErrorException("Failed to update channel");
    }

    return ok({ channelId: thread.id });
  }

  async createOrResolveDm(
    workspaceId: string,
    userId: string,
    dto: CreateDmDto
  ) {
    await this.getWorkspaceMembership(workspaceId, userId);

    if (dto.userId === userId) {
      throw new BadRequestException("Cannot create a DM with yourself");
    }

    const [participants, participantsError] = await attempt(
      db
        .select({ userId: workspaceMembers.userId })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            inArray(workspaceMembers.userId, [userId, dto.userId])
          )
        )
    );
    if (participantsError) {
      throw new InternalServerErrorException("Failed to validate DM members");
    }
    if ((participants ?? []).length !== 2) {
      throw new ForbiddenException("DMs can only be created between members");
    }

    const dmKey = this.normalizeDmKey(userId, dto.userId);

    const [existing, existingError] = await attempt(
      db
        .select({ id: chatThreads.id })
        .from(chatThreads)
        .where(
          and(
            eq(chatThreads.workspaceId, workspaceId),
            eq(chatThreads.type, "dm"),
            eq(chatThreads.dmKey, dmKey)
          )
        )
        .limit(1)
    );
    if (existingError) {
      throw new InternalServerErrorException("Failed to resolve DM thread");
    }
    if (existing?.[0]) {
      return ok({ conversationId: existing[0].id, threadId: existing[0].id });
    }

    const [created, createError] = await attempt(
      db
        .insert(chatThreads)
        .values({
          workspaceId,
          type: "dm",
          dmKey,
          createdById: userId,
        })
        .returning({ id: chatThreads.id })
    );
    if (createError || !created?.[0]) {
      throw new InternalServerErrorException("Failed to create DM thread");
    }

    const threadId = created[0].id;
    const [, memberError] = await attempt(
      db.insert(chatThreadMembers).values([
        { workspaceId, threadId, userId },
        { workspaceId, threadId, userId: dto.userId },
      ])
    );
    if (memberError) {
      throw new InternalServerErrorException("Failed to add DM members");
    }

    return ok({ conversationId: threadId, threadId });
  }

  async joinChannel(workspaceId: string, channelId: string, userId: string) {
    const thread = await this.getThread(workspaceId, channelId);
    if (thread.type !== "channel") {
      throw new NotFoundException("Channel not found");
    }

    await this.getWorkspaceMembership(workspaceId, userId);

    if (thread.visibility === "private") {
      const member = await this.getThreadMember(thread.id, userId);
      if (!member) {
        throw new ForbiddenException("Private channels cannot be joined directly");
      }
      return ok({ channelId: thread.id });
    }

    const [, error] = await attempt(
      db
        .insert(chatThreadMembers)
        .values({ workspaceId, threadId: thread.id, userId })
        .onConflictDoNothing()
    );
    if (error) {
      throw new InternalServerErrorException("Failed to join channel");
    }

    return ok({ channelId: thread.id });
  }

  async leaveChannel(workspaceId: string, channelId: string, userId: string) {
    const thread = await this.getThread(workspaceId, channelId);
    if (thread.type !== "channel") {
      throw new NotFoundException("Channel not found");
    }

    await this.getWorkspaceMembership(workspaceId, userId);

    const [, error] = await attempt(
      db
        .delete(chatThreadMembers)
        .where(
          and(
            eq(chatThreadMembers.workspaceId, workspaceId),
            eq(chatThreadMembers.threadId, thread.id),
            eq(chatThreadMembers.userId, userId)
          )
        )
    );
    if (error) {
      throw new InternalServerErrorException("Failed to leave channel");
    }

    return ok({ channelId: thread.id });
  }

  async lockChannel(workspaceId: string, channelId: string, userId: string) {
    const thread = await this.ensureAdminChannelAccess(
      workspaceId,
      channelId,
      userId
    );

    const [, error] = await attempt(
      db
        .update(chatThreads)
        .set({ lockedAt: new Date(), updatedAt: new Date() })
        .where(eq(chatThreads.id, thread.id))
    );
    if (error) {
      throw new InternalServerErrorException("Failed to lock channel");
    }

    return ok({ channelId: thread.id });
  }

  async unlockChannel(workspaceId: string, channelId: string, userId: string) {
    const thread = await this.ensureAdminChannelAccess(
      workspaceId,
      channelId,
      userId
    );

    const [, error] = await attempt(
      db
        .update(chatThreads)
        .set({ lockedAt: null, updatedAt: new Date() })
        .where(eq(chatThreads.id, thread.id))
    );
    if (error) {
      throw new InternalServerErrorException("Failed to unlock channel");
    }

    return ok({ channelId: thread.id });
  }

  async deleteChannel(workspaceId: string, channelId: string, userId: string) {
    const thread = await this.ensureAdminChannelAccess(
      workspaceId,
      channelId,
      userId
    );

    const [, error] = await attempt(
      db
        .update(chatThreads)
        .set({ archivedAt: new Date(), updatedAt: new Date() })
        .where(eq(chatThreads.id, thread.id))
    );
    if (error) {
      throw new InternalServerErrorException("Failed to delete channel");
    }

    return ok({ channelId: thread.id });
  }

  async listMessages(workspaceId: string, threadId: string, userId: string) {
    const thread = await this.ensureThreadAccess(workspaceId, threadId, userId);

    const [rows, error] = await attempt(
      db
        .select({
          id: chatMessages.id,
          threadId: chatMessages.threadId,
          senderId: chatMessages.senderId,
          content: chatMessages.content,
          editedAt: chatMessages.editedAt,
          deletedAt: chatMessages.deletedAt,
          createdAt: chatMessages.createdAt,
          updatedAt: chatMessages.updatedAt,
          senderName: users.name,
          senderImage: users.image,
        })
        .from(chatMessages)
        .leftJoin(users, eq(chatMessages.senderId, users.id))
        .where(
          and(
            eq(chatMessages.workspaceId, workspaceId),
            eq(chatMessages.threadId, thread.id)
          )
        )
        .orderBy(asc(chatMessages.createdAt))
    );
    if (error) {
      throw new InternalServerErrorException("Failed to list messages");
    }

    const attachmentsByMessageId = await this.loadMessageAttachments(
      (rows ?? []).map((row) => row.id)
    );

    return ok({
      threadId: thread.id,
      messages: (rows ?? []).map((row) => ({
        id: row.id,
        threadId: row.threadId,
        senderId: row.senderId,
        sender: row.senderId
          ? { id: row.senderId, name: row.senderName, image: row.senderImage }
          : null,
        content: row.deletedAt ? null : row.content,
        editedAt: row.editedAt,
        deletedAt: row.deletedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        attachments: attachmentsByMessageId.get(row.id) ?? [],
      })),
    });
  }

  async createMessage(
    workspaceId: string,
    threadId: string,
    userId: string,
    dto: CreateMessageDto
  ) {
    const thread = await this.ensureThreadAccess(workspaceId, threadId, userId);

    if (thread.lockedAt) {
      throw new ForbiddenException("This channel is locked");
    }

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException("Message content cannot be empty");
    }

    const [created, error] = await attempt(
      db
        .insert(chatMessages)
        .values({
          workspaceId,
          threadId: thread.id,
          senderId: userId,
          content,
        })
        .returning({ id: chatMessages.id, createdAt: chatMessages.createdAt })
    );
    if (error || !created?.[0]) {
      throw new InternalServerErrorException("Failed to create message");
    }

    return ok({
      messageId: created[0].id,
      threadId: thread.id,
      createdAt: created[0].createdAt,
    });
  }

  async updateMessage(
    workspaceId: string,
    messageId: string,
    userId: string,
    dto: UpdateMessageDto
  ) {
    const [message, error] = await attempt(
      db
        .select({
          id: chatMessages.id,
          threadId: chatMessages.threadId,
          senderId: chatMessages.senderId,
          deletedAt: chatMessages.deletedAt,
        })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.workspaceId, workspaceId),
            eq(chatMessages.id, messageId)
          )
        )
        .limit(1)
    );
    if (error) {
      throw new InternalServerErrorException("Failed to load message");
    }
    if (!message?.[0] || message[0].deletedAt) {
      throw new NotFoundException("Message not found");
    }
    if (message[0].senderId !== userId) {
      throw new ForbiddenException("You can only edit your own messages");
    }

    await this.ensureThreadAccess(workspaceId, message[0].threadId, userId);

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException("Message content cannot be empty");
    }

    const [, updateError] = await attempt(
      db
        .update(chatMessages)
        .set({ content, editedAt: new Date(), updatedAt: new Date() })
        .where(eq(chatMessages.id, messageId))
    );
    if (updateError) {
      throw new InternalServerErrorException("Failed to update message");
    }

    return ok({ messageId, threadId: message[0].threadId });
  }

  async deleteMessage(
    workspaceId: string,
    messageId: string,
    userId: string
  ) {
    const [message, error] = await attempt(
      db
        .select({
          id: chatMessages.id,
          threadId: chatMessages.threadId,
          senderId: chatMessages.senderId,
          deletedAt: chatMessages.deletedAt,
        })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.workspaceId, workspaceId),
            eq(chatMessages.id, messageId)
          )
        )
        .limit(1)
    );
    if (error) {
      throw new InternalServerErrorException("Failed to load message");
    }
    if (!message?.[0]) {
      throw new NotFoundException("Message not found");
    }
    if (message[0].deletedAt) {
      return ok({ messageId, threadId: message[0].threadId });
    }
    if (message[0].senderId !== userId) {
      throw new ForbiddenException("You can only delete your own messages");
    }

    await this.ensureThreadAccess(workspaceId, message[0].threadId, userId);

    const [, updateError] = await attempt(
      db
        .update(chatMessages)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(chatMessages.id, messageId))
    );
    if (updateError) {
      throw new InternalServerErrorException("Failed to delete message");
    }

    return ok({ messageId, threadId: message[0].threadId });
  }

  async uploadAttachment(
    workspaceId: string,
    messageId: string,
    userId: string,
    dto: UploadAttachmentDto
  ) {
    const [message, error] = await attempt(
      db
        .select({
          id: chatMessages.id,
          threadId: chatMessages.threadId,
          senderId: chatMessages.senderId,
          deletedAt: chatMessages.deletedAt,
        })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.workspaceId, workspaceId),
            eq(chatMessages.id, messageId)
          )
        )
        .limit(1)
    );
    if (error) {
      throw new InternalServerErrorException("Failed to load message");
    }
    if (!message?.[0] || message[0].deletedAt) {
      throw new NotFoundException("Message not found");
    }

    await this.ensureThreadAccess(workspaceId, message[0].threadId, userId);
    const admin = await this.isWorkspaceAdmin(workspaceId, userId);
    if (message[0].senderId !== userId && !admin) {
      throw new ForbiddenException(
        "You can only attach files to your own messages"
      );
    }

    const [attachment, attachmentError] = await attempt(
      db
        .insert(chatMessageAttachments)
        .values({
          workspaceId,
          messageId,
          fileUrl: dto.fileUrl,
          fileName: dto.fileName,
          fileType: dto.fileType,
          fileSize: dto.fileSize,
        })
        .returning({ id: chatMessageAttachments.id })
    );
    if (attachmentError || !attachment?.[0]) {
      throw new InternalServerErrorException("Failed to add attachment");
    }

    return ok({
      attachmentId: attachment[0].id,
      messageId,
      threadId: message[0].threadId,
    });
  }
}
