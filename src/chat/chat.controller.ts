import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtGuard } from "../auth/guard/jwt.guard";
import { ChatService } from "./chat.service";
import { CreateChatDto } from "./dto/create-chat.dto";

@Controller("chats")
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  create(@Req() req: Request, @Body() createChatDto: CreateChatDto) {
    return this.chatService.create(createChatDto, req.user.id);
  }

  @Get()
  getUserChats(@Req() req: Request) {
    return this.chatService.getUserChats(req.user.id);
  }

  @Get(":id/messages?")
  getMessages(
    @Param("id") chatId,
    @Query("take") take,
    @Query("skip") skip,
    @Req() req: Request
  ) {
    return this.chatService.getMessages(chatId, take, skip, req.user.id);
  }
}
