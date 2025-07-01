import { Test, TestingModule } from '@nestjs/testing';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

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

  const mockUrl = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    shortCode: 'Ab3x9Z',
    originalUrl: 'https://example.com',
    clickCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: '8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a',
      email: 'test@example.com'
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [
        {
          provide: UrlService,
          useValue: mockUrlService
        }
      ],
    }).compile();

    controller = module.get<UrlController>(UrlController);
    service = module.get<UrlService>(UrlService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
