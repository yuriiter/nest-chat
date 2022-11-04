import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { Request } from "express";

import { UserService } from "../../user/user.service";

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private configService: ConfigService
  ) {}
  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  async validateRequest(request: Request): Promise<boolean> {
    if (
      request.cookies &&
      "jwt" in request.cookies &&
      request.cookies.jwt.length > 0
    ) {
      const bearerToken = request.cookies.jwt;
      const decoded = jwt.verify(
        bearerToken,
        this.configService.get("JWT_SECRET")
      ) as any;

      const user = await this.userService.validateUser(decoded);

      if (!user) {
        throw new UnauthorizedException();
      }
      request.user = { id: user.id };
      return true;
    }
    throw new UnauthorizedException();
  }
}
