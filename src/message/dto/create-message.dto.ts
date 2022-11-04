import { MessageType } from "@prisma/client";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateMessageDto {
  @IsNumber()
  receiverId: number;

  @IsNumber()
  chatId: number;

  @IsEnum(MessageType)
  messageType: MessageType;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  messageContent: string;

  @IsOptional()
  file: { buffer: Buffer; name: string };
}
