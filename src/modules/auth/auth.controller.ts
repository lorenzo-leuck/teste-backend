import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    type: SignupDto,
    description: 'User signup credentials',
    examples: {
      example1: {
        summary: 'Standard signup',
        description: 'A standard user signup example',
        value: {
          username: 'johndoe',
          email: 'john.doe@example.com',
          password: 'password123'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async signup(@Body() signupDto: SignupDto) {
    try {
      return await this.authService.signup(signupDto);
    } catch (error) {
      console.error('Error in signup controller:', error);
      throw error;
    }
  }


  
  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiBody({
    type: SigninDto,
    description: 'User signin credentials',
    examples: {
      example1: {
        summary: 'Standard signin',
        description: 'A standard user signin example',
        value: {
          email: 'john.doe@example.com',
          password: 'password123'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully signed in',
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signin(@Body() signinDto: SigninDto) {
    return this.authService.signin(signinDto);
  }
  


  @Public()
  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
          username: { type: 'string', example: 'johndoe' },
          email: { type: 'string', example: 'john.doe@example.com' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  async getAllUsers() {
    return this.authService.findAllUsers();
  }
}
