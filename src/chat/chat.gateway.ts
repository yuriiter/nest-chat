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
    private chatService: ChatService
  ) {}

  @WebSocketServer()
  server: Server;

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

  @SubscribeMessage("readChat")
  async readChat(@MessageBody() statusDto: any) {
    const { userId, chatId } = statusDto;

    const chat = await this.prismaService.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        users: true,
      },
    });

    if (!chat) {
      return;
    }
    let userIdx;
    let receiverId;
    if (chat.users[0].id === userId) {
      userIdx = 0;
      receiverId = chat.users[1].id;
    } else if (chat.users[1].id === userId) {
      userIdx = 1;
      receiverId = chat.users[0].id;
    } else {
      return;
    }

    const countOfNewMessagesToUsers = chat.countOfNewMessagesToUsers;
    countOfNewMessagesToUsers[userIdx] = 0;
    await this.prismaService.chat.update({
      where: {
        id: chatId,
      },
      data: {
        countOfNewMessagesToUsers: countOfNewMessagesToUsers,
      },
    });

    this.server.to(`room_${receiverId}`).emit("readMessages", {
      chatId: chatId,
      countOfNewMessagesToUsers: countOfNewMessagesToUsers,
    });
    this.server.to(`room_${userId}`).emit("readMessages", {
      chatId: chatId,
      countOfNewMessagesToUsers: countOfNewMessagesToUsers,
    });
  }

  @SubscribeMessage("newStatus")
  async changeStatus(@MessageBody() statusDto: any) {
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
    await this.chatService.lastOnline(userId, new Date());
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
