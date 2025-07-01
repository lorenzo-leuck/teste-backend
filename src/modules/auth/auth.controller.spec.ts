import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    signin: jest.fn(),
    findAllUsers: jest.fn(),
    softDeleteUser: jest.fn(),
    validateToken: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        }
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('deleteUser', () => {
    it('should delete a user account and return success message', async () => {
      const id = '8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a';
      const req = { user: { id } };
      
      jest.spyOn(service, 'softDeleteUser').mockResolvedValue();

      const result = await controller.deleteUser(id, req);
      
      expect(result).toEqual({ message: 'User account deleted successfully' });
      expect(service.softDeleteUser).toHaveBeenCalledWith(id, req.user.id);
    });

    it('should throw UnauthorizedException if user tries to delete another account', async () => {
      const id = '8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a';
      const req = { user: { id: 'different-user-id' } };
      
      jest.spyOn(service, 'softDeleteUser').mockRejectedValue(new UnauthorizedException());

      await expect(controller.deleteUser(id, req)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const id = 'non-existent-id';
      const req = { user: { id: 'non-existent-id' } };
      
      jest.spyOn(service, 'softDeleteUser').mockRejectedValue(new UnauthorizedException());

      await expect(controller.deleteUser(id, req)).rejects.toThrow(UnauthorizedException);
    });
  });
});
