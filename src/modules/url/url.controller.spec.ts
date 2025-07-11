import { Test, TestingModule } from '@nestjs/testing';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Url } from '../../entities/url.entity';
import { User } from '../../entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import { CreditGuard } from '../auth/credit.guard';
import { AuthService } from '../auth/auth.service';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('UrlController', () => {
  let controller: UrlController;
  let service: UrlService;

  const mockUrlService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUserId: jest.fn(),
    findByShortCode: jest.fn(),
    incrementClickCount: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn()
  };

  const mockUrl = new Url();
  mockUrl.id = '550e8400-e29b-41d4-a716-446655440000';
  mockUrl.shortCode = 'Ab3x9Z';
  mockUrl.originalUrl = 'https://example.com';
  mockUrl.clickCount = 5;
  mockUrl.isDeleted = false;
  mockUrl.createdAt = new Date();
  mockUrl.updatedAt = new Date();
  mockUrl.user = {
    id: '8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a',
    email: 'test@example.com',
    username: 'testuser'
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [
        {
          provide: UrlService,
          useValue: mockUrlService
        },
        {
          provide: AuthService,
          useValue: {
            validateToken: jest.fn()
          }
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn()
          }
        },
        {
          provide: AuthGuard,
          useValue: {
            canActivate: jest.fn().mockImplementation(() => true)
          }
        },
        {
          provide: CreditGuard,
          useValue: {
            canActivate: jest.fn().mockImplementation(() => true)
          }
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            increment: jest.fn(),
            decrement: jest.fn()
          }
        }
      ],
    }).compile();

    controller = module.get<UrlController>(UrlController);
    service = module.get<UrlService>(UrlService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a URL when authenticated', async () => {
      const createUrlDto = { originalUrl: 'https://example.com' };
      const req = { user: mockUrl.user };
      
      jest.spyOn(service, 'create').mockResolvedValue(mockUrl);

      const result = await controller.create(createUrlDto, req);
      
      expect(result).toEqual({
        id: mockUrl.id,
        shortCode: mockUrl.shortCode,
        originalUrl: mockUrl.originalUrl,
        shortUrl: `http://localhost:3000/${mockUrl.shortCode}`,
        expiresAt: mockUrl.expiresAt
      });
      expect(service.create).toHaveBeenCalledWith(createUrlDto, req.user);
    });

    it('should create a URL without authentication', async () => {
      const createUrlDto = { originalUrl: 'https://example.com' };
      const req = {};
      
      jest.spyOn(service, 'create').mockResolvedValue(mockUrl);

      const result = await controller.create(createUrlDto, req);
      
      expect(result).toEqual({
        id: mockUrl.id,
        shortCode: mockUrl.shortCode,
        originalUrl: mockUrl.originalUrl,
        shortUrl: `http://localhost:3000/${mockUrl.shortCode}`,
        expiresAt: mockUrl.expiresAt
      });
      expect(service.create).toHaveBeenCalledWith(createUrlDto, undefined);
    });
  });

  describe('delete', () => {
    it('should delete a URL and return success message', async () => {
      const id = mockUrl.id;
      const req = { user: { id: mockUrl.user.id } };
      
      jest.spyOn(service, 'softDelete').mockResolvedValue();

      const result = await controller.delete(id, req);
      
      expect(result).toEqual({ message: 'URL deleted successfully' });
      expect(service.softDelete).toHaveBeenCalledWith(id, req.user.id);
    });

    it('should throw NotFoundException if URL is not found', async () => {
      const id = 'non-existent-id';
      const req = { user: { id: mockUrl.user.id } };
      
      jest.spyOn(service, 'softDelete').mockRejectedValue(new NotFoundException());

      await expect(controller.delete(id, req)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const id = mockUrl.id;
      const req = { user: { id: 'different-user-id' } };
      
      jest.spyOn(service, 'softDelete').mockRejectedValue(new ForbiddenException());

      await expect(controller.delete(id, req)).rejects.toThrow(ForbiddenException);
    });
  });
});
