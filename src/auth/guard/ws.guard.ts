import { CanActivate, Injectable } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { UserService } from "../../user/user.service";

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private userService: UserService
  ) {}

  async canActivate(context: any): Promise<any> {
    try {
      const cookies: string = context.args[0].handshake.headers.cookie;
      if (!cookies) {
        return false;
      }

      const cookieArray = cookies.split("; ");
      if (cookieArray.length === 0) {
        return false;
      }

      const jwtCookie = cookieArray.find((cookie) => cookie.startsWith("jwt="));
      if (!jwtCookie) {
        return false;
      }

      const jwtCookiePair = jwtCookie.split("=");
      if (jwtCookiePair.length !== 2) {
        return false;
      }

      const bearerToken = jwtCookiePair[1];

      const decoded = jwt.verify(
        bearerToken,
        this.configService.get("JWT_SECRET")
      ) as any;

      context.switchToWs().getData().userId = decoded.sub;
      return await this.userService.validateUser(decoded);
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }
}
