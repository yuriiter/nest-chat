import { join } from "path";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createReadStream } from "fs";
import { Response } from "express";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AssetsService {
  constructor(private prismaService: PrismaService) {}

  async findOne(
    directoryName: string,
    assetName: string,
    userId: number,
    res: Response
  ) {
    const message = await this.prismaService.message.findFirst({
      where: {
        fileActualName: assetName,
      },
      select: {
        fileName: true,
        chat: {
          select: {
            users: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!message) {
      throw new UnauthorizedException();
    }

    const users = message.chat.users;

    if (users[0].id !== userId && users[1].id !== userId) {
      throw new UnauthorizedException();
    }

    const file = createReadStream(
      join(__dirname, "../..", "chat_assets", directoryName, assetName)
    );
    res.set({
      "Content-Disposition": `attachment; filename="${message.fileName}"`,
    });
    return file.pipe(res);
  }
}
