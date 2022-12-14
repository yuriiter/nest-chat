import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { UserService } from "../user/user.service";

@Module({
  imports: [PrismaModule, JwtModule.register({}), ConfigModule.forRoot()],
  controllers: [AuthController],
  providers: [AuthService, UserService],
})
export class AuthModule {}
