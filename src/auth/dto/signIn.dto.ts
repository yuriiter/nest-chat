import { IsByteLength, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsByteLength(6, 20)
  @IsString()
  password: string;
}
