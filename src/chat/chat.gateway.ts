import { OnModuleInit, UseGuards } from '@nestjs/common';
import {
  MessageBody, OnGatewayConnection, OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer, WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from '../message/dto/create-message.dto';
import { WsGuard } from '../auth/guard/ws.guard';
import { MessageService } from '../message/message.service';
import { Context } from 'vm';
import { PrismaService } from '../prisma/prisma.service';


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
    private prismaService: PrismaService
  ) {}

  @WebSocketServer()
  server: Server;
  usersToSocketIds: { userId: number; socketIds: string[] }[];

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket);
    });
  }

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
    });

    if (!receiverUser) {
      throw new WsException("User not found");
    }

    const searchedUserToSocketIds = this.usersToSocketIds.find((userToSocketIds) => {
      return userToSocketIds.userId === userId
    });

    if (!searchedUserToSocketIds) {
      this.usersToSocketIds.push({
        userId: userId as number,
        socketIds: [] as string[],
      });
    }
    else {
      searchedUserToSocketIds.socketIds.push(socketId);
    }

    await this.prismaservice.user.update({
      where: {
        id: userid,
      },
      data: {
        socketids: socketids,
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

    socketIds.push(socketId);

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        socketIds: socketIds,
      },
    });

    console.log(socketIds);
    this.server
      .to(socketIds)
      .emit(
        'onMessage',
        this.messageService.create(createMessageDto, createMessageDto.userId)
      );
  }

  async handleDisconnect(client: Socket) {
    const user = await this.prismaService.user.findFirst({
      where: {
        socketIds: {
          has: client.id,
        },
      },
      select: {
        socketIds: true,
      },
    });
    if (!user) {
      return;
    }

    const socketIds = user.socketIds;

    const newSocketIds = socketIds.filter((socketId) => socketId !== client.id);
    await this.prismaService.user.updateMany({
      where: {
        socketIds: {
          has: client.id,
        },
      },
      data: {
        socketIds: newSocketIds,
      },
    });


  }

  afterInit(server: any): any {
  }
  handleConnection(client: any, ...args): any {
  }
}
