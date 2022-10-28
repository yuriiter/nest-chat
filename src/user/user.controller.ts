import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtGuard } from "../auth/guard/jwt.guard";
import { UserService } from "./user.service";

@Controller("users")
export class UserController {
  constructor(private userService: UserService) {}

  // Get information about current user
  @UseGuards(JwtGuard)
  @Get("me")
  getMe(@Req() req: Request) {
    return this.userService.getMe(req.user.id);
  }

  @UseGuards(JwtGuard)
  @Get("?")
  getByEmail(@Query("email") email: string, @Req() req: Request) {
    if (!email || email.length === 0) {
      return this.userService.getAll();
    }
    return this.userService.getUserByEmail(email, req.user.id);
  }
}
