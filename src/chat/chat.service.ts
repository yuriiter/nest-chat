import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Chat } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prismaService: PrismaService) {}

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
        },
      },
    });

    const nonEmptyChats = userChats.chats.filter(
      (chat) => chat.messages.length > 0
    );

    return nonEmptyChats.map((userChat) => {
      const unreadReceivedMessages = userChat.messages.filter(
        (message) => message.receiverId === userId
      );

      return { ...userChat, countOfUnread: unreadReceivedMessages.length };
    });
  }
}
