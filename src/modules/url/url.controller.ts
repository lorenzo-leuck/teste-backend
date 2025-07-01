import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('urls')
@Controller('urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  @ApiOperation({ summary: 'Create a shortened URL (authenticated)' })
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
    required: true,
    description: 'JWT token for authentication'
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

  @Post('public')
  @Public()
  @ApiOperation({ summary: 'Create a shortened URL (public)' })
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
  async createPublic(@Body() createUrlDto: CreateUrlDto) {
    const url = await this.urlService.create(createUrlDto);
    
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

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all shortened URLs' })
  @ApiResponse({
    status: 200,
    description: 'List of all shortened URLs',
    schema: {
      type: 'array',
      items: {
        properties: {
          id: { type: 'string' },
          shortCode: { type: 'string' },
          originalUrl: { type: 'string' },
          shortUrl: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string' },
              email: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async findAll() {
    const urls = await this.urlService.findAll();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    return urls.map(url => {
      // Sanitize user data to avoid exposing sensitive information
      const sanitizedUser = url.user ? {
        id: url.user.id,
        email: url.user.email
      } : null;
      
      return {
        id: url.id,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        shortUrl: `${baseUrl}/${url.shortCode}`,
        createdAt: url.createdAt,
        user: sanitizedUser
      };
    });
  }
}
