import { CanActivate, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private userService: UserService
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

      return await this.userService.validateUser(decoded);
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }
}
