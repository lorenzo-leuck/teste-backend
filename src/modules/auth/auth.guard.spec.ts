import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: AuthService;
  let reflector: Reflector;

  const mockAuthService = {
    validateToken: jest.fn()
  };

  const mockReflector = {
    get: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: AuthService,
          useValue: mockAuthService
        },
        {
          provide: Reflector,
          useValue: mockReflector
        }
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    authService = module.get<AuthService>(AuthService);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for public routes', async () => {
      const mockExecutionContext = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {}
          })
        })
      } as unknown as ExecutionContext;

      mockReflector.get.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
      expect(reflector.get).toHaveBeenCalledWith('isPublic', mockExecutionContext.getHandler());
    });

    it('should validate token from custom header and return true if valid', async () => {
      const mockUser = { id: '1', username: 'test', email: 'test@example.com' };
      const mockRequest: any = {
        headers: {
          token: 'valid-token'
        },
        path: '/test'
      };
      
      const mockExecutionContext = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest)
        })
      } as unknown as ExecutionContext;

      mockReflector.get.mockReturnValue(false);
      mockAuthService.validateToken.mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext);
      
      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(mockUser);
      expect(authService.validateToken).toHaveBeenCalledWith('valid-token');
    });

    it('should validate token from Authorization header and return true if valid', async () => {
      const mockUser = { id: '1', username: 'test', email: 'test@example.com' };
      const mockRequest: any = {
        headers: {
          authorization: 'Bearer valid-token'
        },
        path: '/test'
      };
      
      const mockExecutionContext = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest)
        })
      } as unknown as ExecutionContext;

      mockReflector.get.mockReturnValue(false);
      mockAuthService.validateToken.mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext);
      
      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(mockUser);
      expect(authService.validateToken).toHaveBeenCalledWith('valid-token');
    });
  });
});
