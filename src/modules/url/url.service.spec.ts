import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UrlService } from './url.service';
import { Url } from '../../entities/url.entity';
import { User } from '../../entities/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockUrl = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  shortCode: 'Ab3x9Z',
  originalUrl: 'https://example.com',
  isDeleted: false,
  clickCount: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: {
    id: '8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a',
    username: 'testuser',
    email: 'test@example.com'
  }
};

const mockUser = {
  id: '8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a',
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  limit: 10,
  usage: 5,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('UrlService', () => {
  let service: UrlService;
  let urlRepository: Repository<Url>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        {
          provide: getRepositoryToken(Url),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            increment: jest.fn(),
            create: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            increment: jest.fn()
          }
        }
      ],
    }).compile();

    service = module.get<UrlService>(UrlService);
    urlRepository = module.get<Repository<Url>>(getRepositoryToken(Url));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all non-deleted URLs', async () => {
      const urls = [mockUrl];
      jest.spyOn(urlRepository, 'find').mockResolvedValue(urls);

      const result = await service.findAll();
      
      expect(result).toEqual(urls);
      expect(urlRepository.find).toHaveBeenCalledWith({
        where: { isDeleted: false },
        relations: ['user'],
        order: { createdAt: 'DESC' }
      });
    });
  });

  describe('findByUserId', () => {
    it('should return all non-deleted URLs for a specific user', async () => {
      const userId = mockUser.id;
      const urls = [mockUrl];
      jest.spyOn(urlRepository, 'find').mockResolvedValue(urls);

      const result = await service.findByUserId(userId);
      
      expect(result).toEqual(urls);
      expect(urlRepository.find).toHaveBeenCalledWith({
        where: { 
          user: { id: userId },
          isDeleted: false 
        },
        order: { createdAt: 'DESC' }
      });
    });
  });

  describe('findByShortCode', () => {
    it('should return a URL by short code if not deleted', async () => {
      const shortCode = mockUrl.shortCode;
      jest.spyOn(urlRepository, 'findOne').mockResolvedValue(mockUrl);

      const result = await service.findByShortCode(shortCode);
      
      expect(result).toEqual(mockUrl);
      expect(urlRepository.findOne).toHaveBeenCalledWith({
        where: { 
          shortCode,
          isDeleted: false 
        }
      });
    });

    it('should throw NotFoundException if URL is not found', async () => {
      const shortCode = 'notfound';
      jest.spyOn(urlRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findByShortCode(shortCode)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update URL if user is owner', async () => {
      const id = mockUrl.id;
      const userId = mockUser.id;
      const originalUrl = 'https://updated-example.com';
      const updatedUrl = { ...mockUrl, originalUrl };
      
      jest.spyOn(urlRepository, 'findOne').mockResolvedValue(mockUrl);
      jest.spyOn(urlRepository, 'save').mockResolvedValue(updatedUrl);

      const result = await service.update(id, userId, originalUrl);
      
      expect(result).toEqual(updatedUrl);
      expect(urlRepository.findOne).toHaveBeenCalledWith({
        where: { 
          id,
          isDeleted: false 
        },
        relations: ['user']
      });
      expect(urlRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if URL is not found', async () => {
      const id = 'notfound';
      const userId = mockUser.id;
      const originalUrl = 'https://updated-example.com';
      
      jest.spyOn(urlRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update(id, userId, originalUrl)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const id = mockUrl.id;
      const userId = 'different-user-id';
      const originalUrl = 'https://updated-example.com';
      
      jest.spyOn(urlRepository, 'findOne').mockResolvedValue(mockUrl);

      await expect(service.update(id, userId, originalUrl)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete URL if user is owner', async () => {
      const id = mockUrl.id;
      const userId = mockUser.id;
      const deletedUrl = { ...mockUrl, isDeleted: true };
      
      jest.spyOn(urlRepository, 'findOne').mockResolvedValue(mockUrl);
      jest.spyOn(urlRepository, 'save').mockResolvedValue(deletedUrl);

      await service.softDelete(id, userId);
      
      expect(urlRepository.findOne).toHaveBeenCalledWith({
        where: { 
          id,
          isDeleted: false 
        },
        relations: ['user']
      });
      expect(urlRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        isDeleted: true
      }));
    });

    it('should throw NotFoundException if URL is not found', async () => {
      const id = 'notfound';
      const userId = mockUser.id;
      
      jest.spyOn(urlRepository, 'findOne').mockResolvedValue(null);

      await expect(service.softDelete(id, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const id = mockUrl.id;
      const userId = 'different-user-id';
      
      jest.spyOn(urlRepository, 'findOne').mockResolvedValue(mockUrl);

      await expect(service.softDelete(id, userId)).rejects.toThrow(ForbiddenException);
    });
  });
});
