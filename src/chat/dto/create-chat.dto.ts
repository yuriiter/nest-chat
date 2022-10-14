import { ArrayMaxSize, ArrayMinSize, IsArray } from 'class-validator';

export class CreateChatDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  users: number[];
}
