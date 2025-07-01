import { Controller, Post, Get, Put, Body, Req, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
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
        clicks: url.clickCount,
        createdAt: url.createdAt,
        user: sanitizedUser
      };
    });
  }

  @Get('byUser')
  @ApiOperation({ summary: 'Get URLs for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of URLs for the authenticated user',
    schema: {
      type: 'array',
      items: {
        properties: {
          id: { type: 'string' },
          shortCode: { type: 'string' },
          originalUrl: { type: 'string' },
          shortUrl: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiHeader({
    name: 'token',
    description: 'JWT token for authentication',
    required: true
  })
  async findByUser(@Req() req: any) {
    const userId = req.user.id;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    const urls = await this.urlService.findByUserId(userId);
    
    return urls.map(url => ({
      id: url.id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      shortUrl: `${baseUrl}/${url.shortCode}`,
      clicks: url.clickCount,
      createdAt: url.createdAt
    }));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a URL created by the authenticated user' })
  @ApiResponse({ status: 200, description: 'URL updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only update your own URLs' })
  @ApiResponse({ status: 404, description: 'URL not found' })
  @ApiHeader({
    name: 'token',
    description: 'JWT token for authentication',
    required: true
  })
  async update(
    @Param('id') id: string,
    @Body() updateUrlDto: UpdateUrlDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    const url = await this.urlService.update(id, userId, updateUrlDto.originalUrl);
    
    return {
      id: url.id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      shortUrl: `${baseUrl}/${url.shortCode}`,
      clicks: url.clickCount,
      updatedAt: url.updatedAt
    };
  }
}
