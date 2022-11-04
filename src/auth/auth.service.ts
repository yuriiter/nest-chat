import { Response } from "express";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SignUpDto } from "./dto/signUp.dto";
import * as argon from "argon2";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { SignInDto } from "./dto/signIn.dto";

@Injectable({})
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async signup(authDto: SignUpDto) {
    const hash = await argon.hash(authDto.password);
    try {
      const user = await this.prismaService.user.create({
        data: {
          email: authDto.email,
          hash: hash,
          fullName: authDto.fullName,
          lastOnline: new Date(),
        },
      });
      delete user.hash;
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ForbiddenException("Credentials taken");
        }
      }
      throw error;
    }
  }

  async signin(authDto: SignInDto, response: Response): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: authDto.email,
      },
    });
    if (!user) {
      throw new BadRequestException("Bad credentials");
    }
    const passwordVerified = await argon.verify(user.hash, authDto.password);
    if (!passwordVerified) {
      throw new BadRequestException("Bad credentials");
    }

    const token = await this.signToken(user.email, user.id);
    response.cookie("jwt", token, {
      expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7),
      httpOnly: true,
      domain: "localhost",
    });
    return response.send({ id: user.id, email: user.email });
  }

  signToken(email: string, userId: number) {
    const data = {
      sub: userId,
      email,
    };
    return this.jwtService.signAsync(data, {
      expiresIn: "7d",
      secret: this.configService.get("JWT_SECRET"),
    });
  }
}
