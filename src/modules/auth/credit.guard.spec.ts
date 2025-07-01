import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CreditGuard } from './credit.guard';
import { User } from '../../entities/user.entity';
import { REQUIRES_CREDITS_KEY } from './requires-credits.decorator';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('CreditGuard', () => {
  let guard: CreditGuard;
  let reflector: Reflector;
  let userRepository: jest.Mocked<any>;

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository
        }
      ],
    }).compile();

    guard = module.get<CreditGuard>(CreditGuard);
    reflector = module.get<Reflector>(Reflector);
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if route is not marked with RequiresCredits decorator', async () => {
      const mockUser = {
        id: '8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a',
        credits: 5
      };
      
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: mockUser
          })
        }),
        getHandler: () => ({}),
        getClass: () => ({})
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should return true if user has credits > 0', async () => {
      const mockUser = {
        id: '8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a',
        credits: 5
      };
      
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: mockUser
          })
        }),
        getHandler: () => ({}),
        getClass: () => ({})
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user has 0 credits', async () => {
      const mockUser = {
        id: '8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a',
        credits: 0
      };
      
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: mockUser
          })
        }),
        getHandler: () => ({}),
        getClass: () => ({})
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user has negative credits', async () => {
      const mockUser = {
        id: '8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a',
        credits: -1
      };
      
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: mockUser
          })
        }),
        getHandler: () => ({}),
        getClass: () => ({})
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });
  });
});
