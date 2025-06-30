import { Controller, Post, Body } from '@nestjs/common';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }
}
