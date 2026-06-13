import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { ApiCookieAuth } from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { ChatService } from "./chat.service";

@ApiCookieAuth()
@Controller("/workspaces/:workspaceId/chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
    @Body() body: any
  ) {
    return await this.chatService.createChannel(
      workspaceId,
      session.user.id,
      body
    );
  }

  @Get("channels/:channelId/messages")
  async listMessages(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string
  ) {
    return await this.chatService.listMessages(workspaceId, channelId);
  }

  @Post("channels/:channelId/messages")
  async postMessage(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @Session() session: UserSession,
    @Body() body: any
  ) {
    return await this.chatService.postMessage(
      workspaceId,
      channelId,
      session.user.id,
      body
    );
  }

  @Get("channels/:channelId/members")
  async listMembers(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string
  ) {
    return await this.chatService.listMembers(workspaceId, channelId);
  }

  @Post("channels/:channelId/members")
  async addMember(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @Session() session: UserSession,
    @Body("userId") userId: string
  ) {
    return await this.chatService.addMember(
      workspaceId,
      channelId,
      session.user.id,
      userId
    );
  }

  @Delete("channels/:channelId/members/:userId")
  async removeMember(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Session() session: UserSession
  ) {
    return await this.chatService.removeMember(
      workspaceId,
      channelId,
      session.user.id,
      userId
    );
  }

  @Post("messages/:messageId/reactions")
  async addReaction(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("messageId", ParseUUIDPipe) messageId: string,
    @Session() session: UserSession,
    @Body("emoji") emoji: string
  ) {
    return await this.chatService.addReaction(
      workspaceId,
      messageId,
      session.user.id,
      emoji
    );
  }

  @Delete("messages/:messageId/reactions")
  async removeReaction(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("messageId", ParseUUIDPipe) messageId: string,
    @Session() session: UserSession,
    @Body("emoji") emoji: string
  ) {
    return await this.chatService.removeReaction(
      workspaceId,
      messageId,
      session.user.id,
      emoji
    );
  }

  @Post("messages/:messageId/read")
  async markRead(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("messageId", ParseUUIDPipe) messageId: string,
    @Session() session: UserSession
  ) {
    return await this.chatService.markRead(
      workspaceId,
      messageId,
      session.user.id
    );
  }
}
