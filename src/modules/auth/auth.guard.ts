import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    console.log('[AuthGuard] Request path:', request.path);
    
    // Check for token in custom header first
    const customToken = request.headers.token as string;
    console.log('[AuthGuard] Custom token header:', customToken ? 'Present' : 'Missing');
    
    // Then check for standard Authorization header
    const authHeader = request.headers.authorization;
    console.log('[AuthGuard] Auth header:', authHeader ? 'Present' : 'Missing');
    
    let token: string;
    
    // Try to get token from custom header first
    if (customToken) {
      token = customToken;
      console.log('[AuthGuard] Using token from custom header');
    }
    // Then try Authorization header
    else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('[AuthGuard] Using token from Authorization header');
    }
    // No valid token found
    else {
      console.log('[AuthGuard] No valid token found in headers');
      throw new UnauthorizedException('Missing or invalid token');
    }
    
    console.log('[AuthGuard] Token to validate, first 10 chars:', token.substring(0, 10));
    
    try {
      const user = await this.authService.validateToken(token);
      console.log('[AuthGuard] Token validated successfully for user:', user.username);
      request.user = user;
      return true;
    } catch (error) {
      console.error('[AuthGuard] Token validation failed:', error.message || 'Unknown error');
      throw new UnauthorizedException('Invalid token');
    }
  }
}
