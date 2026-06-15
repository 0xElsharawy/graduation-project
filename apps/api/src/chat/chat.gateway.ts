import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { auth } from "@/lib/auth";
import { ChatService } from "./chat.service";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  },
  namespace: "/chat",
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Optional: Handle connection
  }

  handleDisconnect(client: Socket) {
    // Optional: Handle disconnection
  }

  @SubscribeMessage("joinThread")
  handleJoinThread(
    @MessageBody() data: { threadId: string },
    @ConnectedSocket() client: Socket
  ) {
    if (data?.threadId) {
      client.join(`thread:${data.threadId}`);
      return { event: "joined", data: data.threadId };
    }
  }

  @SubscribeMessage("leaveThread")
  handleLeaveThread(
    @MessageBody() data: { threadId: string },
    @ConnectedSocket() client: Socket
  ) {
    if (data?.threadId) {
      client.leave(`thread:${data.threadId}`);
      return { event: "left", data: data.threadId };
    }
  }

  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @MessageBody() data: { workspaceId: string; threadId: string; content: string },
    @ConnectedSocket() client: Socket
  ) {
    const headers = new Headers();
    if (client.handshake.headers.cookie) {
      headers.set("cookie", client.handshake.headers.cookie);
    }
    const session = await auth.api.getSession({ headers });
    if (!session?.user) {
      return { event: "error", error: "Unauthorized" };
    }

    const result = await this.chatService.createMessage(
      data.workspaceId,
      data.threadId,
      session.user.id,
      { content: data.content }
    );

    if (result.ok) {
      this.broadcastToThread(data.threadId, "messageCreated", result.data);
      return { event: "messageSent", data: result.data };
    }
    return { event: "error", error: "Cannot broadcast message" };
  }

  broadcastToThread(threadId: string, event: string, payload: any) {
    this.server.to(`thread:${threadId}`).emit(event, payload);
  }
}
