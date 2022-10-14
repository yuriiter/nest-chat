import { OnModuleInit, UseGuards } from '@nestjs/common';
import {
  MessageBody, OnGatewayConnection, OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
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
  clients: Socket[] = [];

  onModuleInit() {
    this.server.on('connection', (socket) => {
      this.clients.push(socket);
    });
  }

  @SubscribeMessage('newMessage')
  async onNewMessage(
    @MessageBody()
    createMessageDto: CreateMessageDto & { userId: number }
  ) {
    console.log(createMessageDto);
    const { socketIds } = await this.prismaService.user.findUnique({
      where: {
        id: createMessageDto.receiverId,
      },
      select: {
        socketIds: true,
      },
    });

    this.server
      .to(socketIds)
      .emit(
        'onMessage',
        this.messageService.create(createMessageDto, createMessageDto.userId)
      );
  }

  async handleDisconnect(client: Socket) {
    const { socketIds } = await this.prismaService.user.findFirst({
      where: {
        socketIds: {
          has: client.id,
        },
      },
      select: {
        socketIds: true,
      },
    });

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
