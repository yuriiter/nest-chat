import { IsByteLength, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsByteLength(6, 20)
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;
}
