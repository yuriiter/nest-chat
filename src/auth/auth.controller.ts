import { Response } from "express";
import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { SignUpDto } from "./dto/signUp.dto";
import { SignInDto } from "./dto/signIn.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  // Sign in
  @Post("signin")
  async postLogin(@Body() signInDto: SignInDto, @Res() response: Response) {
    return await this.authService.signin(signInDto, response);
  }

  // Sign up
  @Post("signup")
  postSignup(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(signUpDto);
  }

  // Sign up
  @Get("signout")
  logout(@Res() res: Response) {
    res.clearCookie("jwt");
    return res
      .status(201)
      .send({ statusCode: 201, message: "Successfully logged out" });
  }
}
