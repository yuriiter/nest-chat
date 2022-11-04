import { Module } from "@nestjs/common";
import { AssetsService } from "./assets.service";
import { AssetsController } from "./assets.controller";
import { UserService } from "src/user/user.service";
import { ConfigService } from "@nestjs/config";

@Module({
  controllers: [AssetsController],
  providers: [AssetsService, UserService, ConfigService],
})
export class AssetsModule {}
