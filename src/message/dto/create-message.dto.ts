import { MessageType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateMessageDto {
  @IsNumber()
  receiverId: number;

  @IsNumber()
  chatId: number;

  @IsEnum(MessageType)
  messageType: MessageType;

  @IsNotEmpty()
  @IsString()
  messageContent: string;
}
