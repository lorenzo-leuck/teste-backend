import { Test, TestingModule } from '@nestjs/testing';
import { MockController } from './mock.controller';
import { AuthService } from '../auth/auth.service';

describe('MockController', () => {
  let controller: MockController;
  
  const mockAuthService = {
    validateToken: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MockController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        }
      ]
    }).compile();

    controller = module.get<MockController>(MockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createMock', () => {
    it('should return a greeting message with the provided name', async () => {
      const mockRequest = {
        name: 'Test User'
      };

      const result = await controller.createMock(mockRequest);

      expect(result).toHaveProperty('message', 'hi Test User');
    });
  });
});
