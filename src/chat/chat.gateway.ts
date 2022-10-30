import { UseGuards } from "@nestjs/common";
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { WsGuard } from "../auth/guard/ws.guard";
import { MessageService } from "../message/message.service";
import { PrismaService } from "../prisma/prisma.service";
import { ChatService } from "./chat.service";
import Status from "../types/status";
import { UserService } from "src/user/user.service";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";

@UseGuards(WsGuard)
@WebSocketGateway({
  cors: {
    origin: ["http://localhost:3000"],
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(
    private messageService: MessageService,
    private prismaService: PrismaService,
    private configService: ConfigService,
    private userService: UserService,
    private chatService: ChatService
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage("status")
  async onStatus(
    @MessageBody()
    createMessageDto: any
  ) {
    const { userId, socketId } = createMessageDto;
    const receiverUser = await this.prismaService.user.findUnique({
      where: {
        id: createMessageDto.receiverId,
      },
      select: {
        socketIds: true,
      },
    });
    if (!receiverUser) {
      throw new WsException("User not found");
    }

    const { socketIds } = receiverUser;

    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });
    socketIds.push(socketId);

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        socketIds: socketIds,
      },
    });

    this.server
      .to(socketIds)
      .emit(
        "onStatus",
        this.messageService.create(createMessageDto, createMessageDto.userId)
      );
  }

  @SubscribeMessage("newMessage")
  async onNewMessage(
    @MessageBody()
    createMessageDto: any
  ) {
    const receiverUser = await this.prismaService.user.findUnique({
      where: {
        id: createMessageDto.receiverId,
      },
    });
    if (!receiverUser) {
      throw new WsException("User not found");
    }

    const newMessage = await this.messageService.create(
      createMessageDto,
      createMessageDto.userId
    );

    this.server.to(`room_${receiverUser.id}`).emit("onMessage", newMessage);
    this.server
      .to(`room_${createMessageDto.userId}`)
      .emit("onMessage", newMessage);
  }

  @SubscribeMessage("newStatus")
  async changeStatus(@MessageBody() statusDto: any) {
    // TODO: now it sends status to all chats instead of sending it only to one
    const { userId, receiverId } = statusDto;

    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        chats: {
          select: {
            id: true,
            users: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const chat = user.chats.find(
      (chat) =>
        chat.users[0].id === receiverId || chat.users[1].id === receiverId
    );
    if (chat) {
      this.server.to(`room_${receiverId}`).emit("statusOfUsers", {
        newStatus: statusDto.newStatus,
        userId: userId,
        chatId: chat.id,
      });
    }
  }

  afterInit(server: any): any {}

  async handleConnection(socket: any) {
    const bearerToken = socket.handshake.headers.authorization.split(" ")[1];
    if (!(await this.chatService.joinRoom(bearerToken, socket))) {
      socket.on("forceDisconnect", function () {
        socket.disconnect();
      });
    }
    const decoded = jwt.verify(
      bearerToken,
      this.configService.get("JWT_SECRET")
    ) as any;

    const userId = decoded.sub;

    const userChats = await this.chatService.getUserChats(+userId);
    for (const userChat of userChats) {
      userChat.users.forEach((user) => {
        if (user.id !== userId) {
          const receiverId = user.id;
          this.server.to(`room_${receiverId}`).emit("statusOfUsers", {
            newStatus: "ONLINE",
            userId: userId,
            chatId: userChat.id,
          });
        }
      });
    }
  }

  async handleDisconnect(socket: any) {
    const bearerToken = socket.handshake.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(
      bearerToken,
      this.configService.get("JWT_SECRET")
    ) as any;

    const userId = decoded.sub;
    const userChats = await this.chatService.getUserChats(+userId);
    await this.chatService.lastOnline(userId);
    for (const userChat of userChats) {
      userChat.users.forEach((user) => {
        if (user.id !== userId) {
          const receiverId = user.id;
          this.server.to(`room_${receiverId}`).emit("statusOfUsers", {
            newStatus: "LAST_ONLINE",
            userId: userId,
            chatId: userChat.id,
          });
        }
      });
    }
  }
}
