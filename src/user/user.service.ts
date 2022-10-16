import { User } from '@prisma/client';
import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}
  async getMe(userId: number) {
    try {
      const user: User = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });

      delete user.hash;
      return user;
    } catch (error) {
      throw new BadRequestException("Invalid parameters");
    }
  }

  async getAll() {
    try {
      return await this.prismaService.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          lastOnline: true,
        },
      });
    } catch (error) {
      throw new BadRequestException("Invalid parameters");
    }
  }

  async getUserByEmail(email: string, enquiringUserId: number) {
    const searchedUser = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
    });

    if(!searchedUser) {
      throw new BadRequestException("User with email " + email + " doesn't exist");
    }

    if(searchedUser.id === enquiringUserId) {
      throw new BadRequestException("The user with the email is the enquiring user");
    }

    delete searchedUser.hash;

    return searchedUser;
  }


  async validateUser(payload: { sub: number; email: string }) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if(user !== null) {
      delete user.hash;
    }
    else {
      return false;
    }

    return user;
  }
}
