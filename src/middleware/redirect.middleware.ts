import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UrlService } from '../modules/url/url.service';

@Injectable()
export class RedirectMiddleware implements NestMiddleware {
  constructor(private readonly urlService: UrlService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only process GET requests to the root path
    if (req.method !== 'GET' || req.path.startsWith('/api/')) {
      return next();
    }

    // Extract the potential short code from the path
    const path = req.path.substring(1); // Remove leading slash
    
    // Skip empty path (root) and paths that don't match the short code pattern
    if (!path || path.length !== 6 || !/^[a-zA-Z0-9]{6}$/.test(path)) {
      return next();
    }

    try {
      // Try to find the URL by short code
      // The findByShortCode method already checks for expiration
      const url = await this.urlService.findByShortCode(path);
      
      // Increment click count asynchronously
      this.urlService.incrementClickCount(path)
        .catch(error => console.error(`Failed to increment click count: ${error.message}`));
      
      // Redirect to the original URL
      return res.redirect(url.originalUrl);
    } catch (error) {
      // Handle expired URLs specifically
      if (error instanceof NotFoundException && error.message.includes('expired')) {
        return res.status(410).json({ 
          statusCode: 410,
          message: 'This link has expired',
          error: 'Gone'
        });
      }
      
      // If URL not found or other error, continue to the next middleware/handler
      return next();
    }
  }
}
