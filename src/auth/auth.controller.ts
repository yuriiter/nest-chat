import { Body, Controller, Post } from "@nestjs/common";
import { SignUpDto } from "./dto/signUp.dto";
import { SignInDto } from "./dto/signIn.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  // Sign in
  @Post("signin")
  async postLogin(@Body() signInDto: SignInDto) {
    return await this.authService.signin(signInDto);
  }

  // Sign up
  @Post("signup")
  postSignup(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(signUpDto);
  }
}
