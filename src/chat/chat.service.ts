import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Chat } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { UserService } from '../user/user.service';
import { Socket } from 'socket.io';

@Injectable()
export class ChatService {
  constructor(
    private prismaService: PrismaService,
    private userService: UserService,
    private configService: ConfigService
  ) {}

  async create(createChatDto: CreateChatDto, userId: number) {
    const userIds = createChatDto.users;
    const isArrayValid =
      (userIds[0] === userId || userIds[1] === userId) &&
      userIds[0] !== userIds[1];

    if (!isArrayValid) {
      throw new BadRequestException('Invalid parameters: users');
    }

    const receiverId = userIds[0] === userId ? userIds[1] : userIds[0];

    const receiver = await this.prismaService.user.findUnique({
      where: {
        id: receiverId,
      },
      include: {
        chats: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!receiver) {
      throw new BadRequestException("User doesn't exist");
    }

    const existingChat = receiver.chats.filter((chat) => {
      return (
        (chat.users[0].id === receiver.id && chat.users[1].id === userId) ||
        (chat.users[1].id === receiver.id && chat.users[0].id === userId)
      );
    });

    if (existingChat.length > 0) {
      const returnedChat: Chat & { countOfUnread?: number } =
        await this.prismaService.chat.findUnique({
          where: {
            id: existingChat[0].id,
          },
          include: {
            users: {
              select: {
                id: true,
                fullName: true,
                email: true,
                lastOnline: true,
              },
            },
            messages: {
              select: {
                sentDateTime: true,
                messageType: true,
                messageContent: true,
                receiverId: true,
                authorId: true,
              },
            },
          },
        });
      return returnedChat;
    }

    const newChat: Chat & { countOfUnread?: number } =
      await this.prismaService.chat.create({
        data: {
          users: {
            connect: [{ id: userIds[0] }, { id: userIds[1] }],
          },
        },
        include: {
          users: {
            select: {
              id: true,
              fullName: true,
              email: true,
              lastOnline: true,
            },
          },
          messages: true,
        },
      });
    newChat.countOfUnread = 0;

    return newChat;
  }

  async getMessages(
    chatId: number,
    take_: number,
    skip_: number,
    userId: number
  ) {
    const take = take_ || 15;
    const skip = skip_ || 0;

    const chat = await this.prismaService.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        messages: true,
        users: true,
      },
    });
    if (!chat) {
      throw new BadRequestException('Invalid parameters');
    }

    const doesUserBelongToChat =
      chat.users.map((user) => user.id).indexOf(userId) !== -1;

    if (!doesUserBelongToChat) {
      throw new BadRequestException('Invalid parameters');
    }

    return await this.prismaService.message.findMany({
      where: {
        chatId: chatId,
      },
      take: take,
      skip: skip,
      orderBy: {
        sentDateTime: 'desc',
      },
    });
  }

  async getUserChats(userId: number) {
    const userChats = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        chats: {
          include: {
            users: {
              select: {
                id: true,
                lastOnline: true,
                fullName: true,
              },
            },
            messages: {
              select: {
                id: true,
                sentDateTime: true,
                messageType: true,
                messageContent: true,
                receiverId: true,
                authorId: true,
              },
            },
          },
        },
      },
    });

    const nonEmptyChats = userChats.chats.filter(
      (chat) => chat.messages.length > 0
    );
    return nonEmptyChats;
  }

  async mapSocketIdsToUsers(
    bearerToken: string,
    socket: Socket,
    usersToSockets: { userId: number; sockets: Socket[] }[]
  ) {
    try {
      const socketId = socket.id;
      const decoded = jwt.verify(
        bearerToken,
        this.configService.get('JWT_SECRET')
      ) as any;

      const user = await this.userService.validateUser(decoded);

      if(!user) {
        return false;
      }

      if(!usersToSockets) {
        usersToSockets = [];
      }

      const userToSocketIds = usersToSockets.find(
        (item) => item.userId === user.id
      );
      if(userToSocketIds) {
        userToSocketIds.sockets.push(socket);
      }
      else {
        usersToSockets.push({ userId: user.id, sockets: [socket] });
      }
      return true;
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }


  async removeSocketIdFromMap(
    socket: Socket,
    usersToSockets: { userId: number; sockets: Socket[] }[]
  ) {
    try {
      const userToSockets = usersToSockets.find(
        (item) => item.sockets.indexOf(socket) !== -1
      );
      if (userToSockets) {
        if(userToSockets.sockets.length === 1) {
          usersToSockets = usersToSockets.filter(
            (item) => item !== userToSockets);
        }
        else {
          userToSockets.sockets = userToSockets.sockets.filter(
            (item) => item === socket
          );
        }
      }
      return true;
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }
}
