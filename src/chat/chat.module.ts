import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { MessageService } from '../message/message.service';
import { ChatController } from './chat.controller';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [ChatGateway, ChatService, MessageService, ConfigService],
  controllers: [ChatController],
})
export class ChatModule {}
