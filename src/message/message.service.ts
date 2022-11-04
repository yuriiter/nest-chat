import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateMessageDto } from "./dto/create-message.dto";
import { PrismaService } from "../prisma/prisma.service";

import { join } from "path";
import { writeFile } from "fs";

const imgPath: string = join(__dirname, "../..", "chat_assets", "img");
const filePath: string = join(__dirname, "../..", "chat_assets", "files");
const recordingPath: string = join(
  __dirname,
  "../..",
  "chat_assets",
  "recordings"
);

@Injectable()
export class MessageService {
  constructor(private prismaService: PrismaService) {}

  async create(createMessageDto: CreateMessageDto, userId: number) {
    try {
      let [fileActualName, fileName, messageContent]: string[] = new Array(
        3
      ).fill(null) as string[];
      let fileSize: number;

      if (createMessageDto.messageType === "TEXT") {
        messageContent = createMessageDto.messageContent;
      } else {
        let uploadPath: string;
        switch (createMessageDto.messageType) {
          case "FILE":
            uploadPath = filePath;
            break;
          case "IMAGE":
            uploadPath = imgPath;
            break;
          case "RECORDING":
            uploadPath = recordingPath;
            break;
        }
        fileActualName =
          "" +
          Math.random() +
          "" +
          createMessageDto.chatId +
          "" +
          createMessageDto.receiverId +
          "" +
          Date.now() +
          "" +
          Math.random();

        fileSize = Buffer.byteLength(createMessageDto.file.buffer);
        fileName = createMessageDto.file.name;

        await writeFile(
          join(uploadPath, fileActualName),
          createMessageDto.file.buffer,
          (err) => {
            if (err) {
              throw err;
            }
          }
        );
      }

      const newMessage = await this.prismaService.message.create({
        data: {
          messageContent: messageContent,
          messageType: createMessageDto.messageType,
          fileActualName,
          fileSize,
          fileName,
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

      return newMessage;
    } catch (err) {
      throw new BadRequestException("Invalid parameters");
    }
  }
}
