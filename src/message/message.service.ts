import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private prismaService: PrismaService) {}

  async create(createMessageDto: CreateMessageDto, userId: number) {
    try {
      const newMessage = await this.prismaService.message.create({
        data: {
          messageContent: createMessageDto.messageContent,
          messageType: createMessageDto.messageType,
          author: {
            connect: { id: userId },
          },
          receiver: {
            connect: { id: createMessageDto.receiverId },
          },
          chat: {
            connect: { id: createMessageDto.chatId },
          },
        },
      });

      const { users, countOfNewMessagesToUsers } =
        await this.prismaService.chat.findUnique({
        where: {
          id: createMessageDto.chatId,
        },
        select: {
          users: true,
          countOfNewMessagesToUsers: true,
        },
      });

      const usersIds = users.map((user) => user.id);

      const userInArrayIdx = usersIds.indexOf(createMessageDto.receiverId);
      countOfNewMessagesToUsers[userInArrayIdx]++;

      await this.prismaService.chat.update({
        where: {
          id: createMessageDto.chatId,
        },
        data: {
          countOfNewMessagesToUsers: countOfNewMessagesToUsers,
        },
      });

    }
    catch (err) {
      throw new BadRequestException("Invalid parameters");
    }
    return { message: "Successfully sent" };
  }
}
