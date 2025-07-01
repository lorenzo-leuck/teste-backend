import { Body, Controller, Post, Get, Req, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiBody, ApiHeader } from '@nestjs/swagger';
import { MockRequestDto } from './dto/mock-request.dto';
import { MockResponseDto } from './dto/mock-response.dto';
import { Public } from '../auth/public.decorator';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service';

@ApiTags('mock')
@Controller('mock')
export class MockController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a mock resource' })
  @ApiResponse({ 
    status: 201, 
    description: 'The mock resource has been successfully created.',
    type: MockResponseDto 
  })
  async createMock(@Body() mockRequestDto: MockRequestDto): Promise<MockResponseDto> {
    return {
      message: `hi ${mockRequestDto.name}`
    };
  }

  @Get('auth')
  @ApiHeader({
    name: 'token',
    description: 'JWT token (without Bearer prefix)',
    required: true,
    schema: {
      type: 'string',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  })
  @ApiOperation({ 
    summary: 'Protected endpoint that requires authentication',
    description: 'This endpoint requires a JWT token in the token header (without Bearer prefix)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns user information from the authentication token',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid token',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Invalid token' },
        error: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 }
      }
    }
  })
  async getProtectedData(@Req() request: Request) {
    try {
      // Get token from custom header
      const token = request.headers.token as string;
      console.log('Token header received:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.log('Missing token header');
        throw new UnauthorizedException('Missing token');
      }
      
      console.log('Token received:', token.substring(0, 10) + '...');
      
      try {
        const user = await this.authService.validateToken(token);
        console.log('Token validated successfully for user:', user.username);
        
        return {
          message: 'You have successfully accessed a protected endpoint',
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        };
      } catch (tokenError) {
        console.error('Token validation failed:', tokenError.message);
        throw new UnauthorizedException('Invalid token');
      }
    } catch (error) {
      console.error('Auth error:', error.message);
      throw new UnauthorizedException(error.message || 'Invalid token');
    }
  }
}
