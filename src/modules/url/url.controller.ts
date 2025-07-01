import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('urls')
@Controller('urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  @ApiOperation({ summary: 'Create a shortened URL' })
  @ApiResponse({ 
    status: 201, 
    description: 'URL shortened successfully',
    schema: {
      properties: {
        id: { type: 'string' },
        shortCode: { type: 'string' },
        originalUrl: { type: 'string' },
        shortUrl: { type: 'string' }
      }
    }
  })
  @ApiHeader({
    name: 'token',
    required: false,
    description: 'JWT token for authenticated users (optional)'
  })
  async create(@Body() createUrlDto: CreateUrlDto, @Req() req: any) {
    const user = req.user;
    const url = await this.urlService.create(createUrlDto, user);
    
    // Construct the full short URL with domain
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const shortUrl = `${baseUrl}/${url.shortCode}`;
    
    return {
      id: url.id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      shortUrl
    };
  }
}
