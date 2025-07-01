import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MockRequestDto } from './dto/mock-request.dto';
import { MockResponseDto } from './dto/mock-response.dto';
import { Public } from '../auth/public.decorator';
import { Request } from 'express';

@ApiTags('mock')
@Controller('mock')
export class MockController {
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Protected endpoint that requires authentication' })
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProtectedData(@Req() request: Request) {
    const user = request['user'];
    return {
      message: 'You have successfully accessed a protected endpoint',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }
}
