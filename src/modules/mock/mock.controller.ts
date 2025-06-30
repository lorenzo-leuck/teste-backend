import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MockRequestDto } from './dto/mock-request.dto';
import { MockResponseDto } from './dto/mock-response.dto';

@ApiTags('mock')
@Controller('mock')
export class MockController {
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
}
