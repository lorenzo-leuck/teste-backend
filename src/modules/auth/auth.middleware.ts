import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const user = await this.authService.validateToken(token);
      req['user'] = user;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid authorization token');
    }
  }
}
