import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Check for token in custom header first
    const customToken = req.headers.token as string;
    
    // Then check for standard Authorization header
    const authHeader = req.headers.authorization;
    
    let token: string;
    
    // Try to get token from custom header first
    if (customToken) {
      token = customToken;
    }
    // Then try Authorization header
    else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // No valid token found
    else {
      throw new UnauthorizedException('Missing or invalid token');
    }
    
    try {
      const user = await this.authService.validateToken(token);
      req['user'] = user;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
