import { Test, TestingModule } from '@nestjs/testing';
import { MockController } from './mock.controller';

describe('MockController', () => {
  let controller: MockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MockController],
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
