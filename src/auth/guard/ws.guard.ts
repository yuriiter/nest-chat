import { CanActivate, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService
  ) {}

  async canActivate(context: any): Promise<any> {
    const bearerToken =
      context.args[0].handshake.headers.authorization.split(' ')[1];
    try {
      const clientSocketId = context.args[0].client.id;
      const decoded = jwt.verify(
        bearerToken,
        this.configService.get('JWT_SECRET')
      ) as any;

      context.switchToWs().getData().userId = decoded.sub;
      context.switchToWs().getData().socketId = context.args[0].client.id;

      return await this.validate(decoded);
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if(user !== null) {
      delete user.hash;
    }
    else {
      return false;
    }

    return user;
  }
}
