import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { MessageService } from "../message/message.service";
import { ChatController } from "./chat.controller";
import { ConfigService } from "@nestjs/config";
import { UserService } from "../user/user.service";

@Module({
  providers: [
    ChatGateway,
    ChatService,
    MessageService,
    ConfigService,
    UserService,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
