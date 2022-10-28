import { Controller, Post, Body, Req } from "@nestjs/common";
import { MessageService } from "./message.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { Request } from "express";

@Controller("messages")
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto, @Req() req: Request) {
    return this.messageService.create(createMessageDto, req.user.id);
  }
}
