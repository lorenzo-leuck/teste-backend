import { Controller, Post, Get, Put, Delete, Body, Req, Param, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CreditGuard } from '../auth/credit.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { RenewUrlDto } from './dto/renew-url.dto';
import { GenerateQrCodeDto } from './dto/generate-qrcode.dto';
import { Public } from '../auth/public.decorator';
import { RequiresCredits } from '../auth/requires-credits.decorator';
import { Response } from 'express';

@ApiTags('urls')
@Controller('urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  @UseGuards(AuthGuard, CreditGuard)
  @RequiresCredits()
  @ApiOperation({ summary: 'Create a shortened URL (authenticated)' })
  @ApiResponse({ 
    status: 201, 
    description: 'URL shortened successfully',
    schema: {
      properties: {
        id: { type: 'string' },
        shortCode: { type: 'string' },
        originalUrl: { type: 'string' },
        shortUrl: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time', nullable: true }
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
      shortUrl,
      expiresAt: url.expiresAt
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
        shortUrl: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time', nullable: true }
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
      shortUrl,
      expiresAt: url.expiresAt
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
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          isExpired: { type: 'boolean' },
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
    const now = new Date();
    
    return urls.map(url => {
      // Sanitize user data to avoid exposing sensitive information
      const sanitizedUser = url.user ? {
        id: url.user.id,
        email: url.user.email
      } : null;
      
      // Check if URL is expired
      const isExpired = url.expiresAt ? now > url.expiresAt : false;
      
      return {
        id: url.id,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        shortUrl: `${baseUrl}/${url.shortCode}`,
        clicks: url.clickCount,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
        isExpired,
        user: sanitizedUser
      };
    });
  }

  @Get('byUser')
  @UseGuards(AuthGuard)
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
          createdAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          isExpired: { type: 'boolean' }
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
    const now = new Date();
    
    const urls = await this.urlService.findByUserId(userId);
    
    return urls.map(url => {
      // Check if URL is expired
      const isExpired = url.expiresAt ? now > url.expiresAt : false;
      
      return {
        id: url.id,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        shortUrl: `${baseUrl}/${url.shortCode}`,
        clicks: url.clickCount,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
        isExpired
      };
    });
  }

  @Put(':id')
  @UseGuards(AuthGuard)
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
  
  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete a URL created by the authenticated user' })
  @ApiResponse({ status: 200, description: 'URL deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only delete your own URLs' })
  @ApiResponse({ status: 404, description: 'URL not found' })
  @ApiHeader({
    name: 'token',
    description: 'JWT token for authentication',
    required: true
  })
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    await this.urlService.softDelete(id, userId);
    
    return { message: 'URL deleted successfully' };
  }

  @Post('qrcode')
  @Public()
  @ApiOperation({ summary: 'Generate QR code for a shortened URL' })
  @ApiResponse({
    status: 200,
    description: 'QR code generated successfully',
    content: {
      'image/png': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      },
      'image/jpeg': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'URL not found' })
  async generateQRCode(@Body() generateQrCodeDto: GenerateQrCodeDto, @Res() res: Response): Promise<void> {
    const { shortCode, format } = generateQrCodeDto;
    const qrCodeBuffer = await this.urlService.generateQRCode(shortCode, format);
    
    // Set appropriate content type based on format
    const contentType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="qrcode-${shortCode}.${format}"`
    });
    
    res.status(HttpStatus.OK).send(qrCodeBuffer);
  }

  @Put(':id/renew')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Renew expiration for a URL created by the authenticated user' })
  @ApiResponse({ 
    status: 200, 
    description: 'URL expiration renewed successfully',
    schema: {
      properties: {
        id: { type: 'string' },
        shortCode: { type: 'string' },
        originalUrl: { type: 'string' },
        shortUrl: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only renew your own URLs' })
  @ApiResponse({ status: 404, description: 'URL not found' })
  @ApiHeader({
    name: 'token',
    description: 'JWT token for authentication',
    required: true
  })
  async renewExpiration(
    @Param('id') id: string,
    @Body() renewUrlDto: RenewUrlDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    const url = await this.urlService.renewExpiration(id, userId, renewUrlDto.expirationDuration);
    
    return {
      id: url.id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      shortUrl: `${baseUrl}/${url.shortCode}`,
      expiresAt: url.expiresAt,
      updatedAt: url.updatedAt
    };
  }
}