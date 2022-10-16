import { OnModuleInit, UseGuards } from '@nestjs/common';
import {
  MessageBody, OnGatewayConnection, OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer, WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsGuard } from '../auth/guard/ws.guard';
import { MessageService } from '../message/message.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';


@UseGuards(WsGuard)
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayConnection
{
  constructor(
    private messageService: MessageService,
    private prismaService: PrismaService,
    private chatService: ChatService
  ) {}

  @WebSocketServer()
  server: Server;
  usersToSockets: { userId: number; sockets: Socket[] }[] = [];


  @SubscribeMessage('status')
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
    if(!receiverUser) {
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
        'onStatus',
        this.messageService.create(createMessageDto, createMessageDto.userId)
      );
  }

  @SubscribeMessage('newMessage')
  async onNewMessage(
    @MessageBody()
    createMessageDto: any,
  ) {
    const { userId } = createMessageDto;
    const receiverUser = await this.prismaService.user.findUnique({
      where: {
        id: createMessageDto.receiverId,
      },
    });
    if(!receiverUser) {
      throw new WsException("User not found");
    }

    const receiverToSockets = this.usersToSockets.find(
      (item) => item.userId === receiverUser.id
    );
    const senderToSockets = this.usersToSockets.find(
      (item) => item.userId === userId
    );

    let sockets = senderToSockets?.sockets || [];
    if (receiverToSockets) {
      sockets = [...receiverToSockets?.sockets, ...sockets];
    }

    const newMessage = await this.messageService.create(
      createMessageDto,
      createMessageDto.userId
    );

    for (let i = 0; i < sockets.length; i++) {
      const socket = sockets[i];
      socket.emit("onMessage", newMessage);
    }
  }

  async handleDisconnect(socket: any) {
    this.chatService.removeSocketIdFromMap(
      socket,
      this.usersToSockets
    );
  }

  afterInit(server: any): any {
  }


  async handleConnection(socket: any) {
    const bearerToken = socket.handshake.headers.authorization.split(' ')[1];
    if (
      !(await this.chatService.mapSocketIdsToUsers(
        bearerToken,
        socket,
        this.usersToSockets
      ))
    ) {
      socket.on('forceDisconnect', function(){
        socket.disconnect();
      });
    }
  }
}

// TODO: create an initialization event, sending user id to the server
