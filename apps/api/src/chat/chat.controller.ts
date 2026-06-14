import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiCookieAuth } from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { ChatService } from "./chat.service";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { CreateDmDto } from "./dto/create-dm.dto";
import { CreateMessageDto } from "./dto/create-message.dto";
import { UpdateChannelDto } from "./dto/update-channel.dto";
import { UpdateMessageDto } from "./dto/update-message.dto";
import { UploadAttachmentDto } from "./dto/upload-attachment.dto";

@ApiCookieAuth()
@Controller("workspaces/:workspaceId/chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("threads")
  async listThreads(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Session() session: UserSession
  ) {
    return await this.chatService.listThreads(workspaceId, session.user.id);
  }

  @Get("channels")
  async listChannels(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Session() session: UserSession
  ) {
    return await this.chatService.listChannels(workspaceId, session.user.id);
  }

  @Post("channels")
  async createChannel(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Session() session: UserSession,
    @Body() dto: CreateChannelDto
  ) {
    return await this.chatService.createChannel(
      workspaceId,
      session.user.id,
      dto
    );
  }

  @Patch("channels/:channelId")
  async updateChannel(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @Session() session: UserSession,
    @Body() dto: UpdateChannelDto
  ) {
    return await this.chatService.updateChannel(
      workspaceId,
      channelId,
      session.user.id,
      dto
    );
  }

  @Post("channels/:channelId/join")
  async joinChannel(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @Session() session: UserSession
  ) {
    return await this.chatService.joinChannel(
      workspaceId,
      channelId,
      session.user.id
    );
  }

  @Post("channels/:channelId/leave")
  async leaveChannel(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @Session() session: UserSession
  ) {
    return await this.chatService.leaveChannel(
      workspaceId,
      channelId,
      session.user.id
    );
  }

  @Post("channels/:channelId/lock")
  async lockChannel(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @Session() session: UserSession
  ) {
    return await this.chatService.lockChannel(
      workspaceId,
      channelId,
      session.user.id
    );
  }

  @Post("channels/:channelId/unlock")
  async unlockChannel(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @Session() session: UserSession
  ) {
    return await this.chatService.unlockChannel(
      workspaceId,
      channelId,
      session.user.id
    );
  }

  @Delete("channels/:channelId")
  async deleteChannel(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @Session() session: UserSession
  ) {
    return await this.chatService.deleteChannel(
      workspaceId,
      channelId,
      session.user.id
    );
  }

  @Post("dm")
  async createOrResolveDm(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Session() session: UserSession,
    @Body() dto: CreateDmDto
  ) {
    return await this.chatService.createOrResolveDm(
      workspaceId,
      session.user.id,
      dto
    );
  }

  @Get("threads/:threadId/messages")
  async listMessages(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("threadId", ParseUUIDPipe) threadId: string,
    @Session() session: UserSession
  ) {
    return await this.chatService.listMessages(
      workspaceId,
      threadId,
      session.user.id
    );
  }

  @Post("threads/:threadId/messages")
  async createMessage(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("threadId", ParseUUIDPipe) threadId: string,
    @Session() session: UserSession,
    @Body() dto: CreateMessageDto
  ) {
    return await this.chatService.createMessage(
      workspaceId,
      threadId,
      session.user.id,
      dto
    );
  }

  @Patch("messages/:messageId")
  async updateMessage(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("messageId", ParseUUIDPipe) messageId: string,
    @Session() session: UserSession,
    @Body() dto: UpdateMessageDto
  ) {
    return await this.chatService.updateMessage(
      workspaceId,
      messageId,
      session.user.id,
      dto
    );
  }

  @Delete("messages/:messageId")
  async deleteMessage(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("messageId", ParseUUIDPipe) messageId: string,
    @Session() session: UserSession
  ) {
    return await this.chatService.deleteMessage(
      workspaceId,
      messageId,
      session.user.id
    );
  }

  @Post("messages/:messageId/attachments")
  async uploadAttachment(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("messageId", ParseUUIDPipe) messageId: string,
    @Session() session: UserSession,
    @Body() dto: UploadAttachmentDto
  ) {
    return await this.chatService.uploadAttachment(
      workspaceId,
      messageId,
      session.user.id,
      dto
    );
  }
}
