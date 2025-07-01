import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './modules/auth/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'API root endpoint' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns API welcome message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: HttpStatus.OK, description: 'API is healthy' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}
