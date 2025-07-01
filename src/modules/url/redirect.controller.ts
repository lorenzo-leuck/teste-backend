import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { UrlService } from './url.service';
import { Public } from '../auth/public.decorator';

@ApiTags('redirect')
@Controller('/')
export class RedirectController {
  constructor(private readonly urlService: UrlService) {}

  @Get(':shortCode')
  @Public()
  @ApiOperation({ summary: 'Redirect to original URL' })
  @ApiResponse({ 
    status: 302, 
    description: 'Redirect to the original URL'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Short URL not found'
  })
  @ApiParam({
    name: 'shortCode',
    required: true,
    description: 'The short code of the URL',
    type: String
  })
  async redirect(
    @Param('shortCode') shortCode: string,
    @Res() res: Response
  ) {
    try {
      const url = await this.urlService.findByShortCode(shortCode);
      
      // Redirect to the original URL
      return res.redirect(url.originalUrl);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`URL with short code ${shortCode} not found`);
    }
  }
}
