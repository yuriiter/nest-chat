import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  controllers: [UserController],
  providers: [UserService, ConfigService],
})
export class UserModule {}
