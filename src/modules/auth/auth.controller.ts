import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';

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
  @Get('test')
  @ApiOperation({ summary: 'Test endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Test successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Test endpoint working!' }
      }
    }
  })
  async testEndpoint() {
    return { message: 'Test endpoint working!' };
  }
  
  @Public()
  @Post('test-signup')
  @ApiOperation({ summary: 'Test signup endpoint without database' })
  @ApiBody({
    type: SignupDto,
    description: 'User signup credentials'
  })
  @ApiResponse({
    status: 201,
    description: 'Test signup successful',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    }
  })
  async testSignup(@Body() signupDto: SignupDto) {
    // This endpoint doesn't interact with the database
    // It's just for testing if the API is working
    const token = `test-token-${Math.random().toString(36).substring(2, 10)}`;
    return { token, user: { username: signupDto.username, email: signupDto.email } };
  }
  
  @Public()
  @Post('db-test')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Test database operations' })
  @ApiBody({
    type: SignupDto,
    description: 'User signup credentials'
  })
  @ApiResponse({
    status: 201,
    description: 'Database test successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        operation: { type: 'string' },
        userExists: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Database test failed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        operation: { type: 'string' },
        error: { type: 'string' },
        stack: { type: 'string' }
      }
    }
  })
  async dbTest(@Body() signupDto: SignupDto) {
    try {
      // Step 1: Check if we can query the database
      const existingUser = await this.authService.findUserByUsernameOrEmail(
        signupDto.username, 
        signupDto.email
      );
      
      // Step 2: Return result without trying to create a user
      return { 
        success: true, 
        operation: 'query',
        userExists: !!existingUser,
        message: 'Database query successful'
      };
    } catch (error) {
      return { 
        success: false, 
        operation: 'query',
        error: error.message || 'Unknown error',
        stack: error.stack
      };
    }
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
