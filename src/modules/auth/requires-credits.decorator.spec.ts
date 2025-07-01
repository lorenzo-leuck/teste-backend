import { SetMetadata } from '@nestjs/common';
import { RequiresCredits, REQUIRES_CREDITS_KEY } from './requires-credits.decorator';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn().mockImplementation((key, value) => ({ key, value }))
}));

describe('RequiresCredits Decorator', () => {
  it('should call SetMetadata with the correct key and value', () => {
    const result = RequiresCredits();
    
    expect(SetMetadata).toHaveBeenCalledWith(REQUIRES_CREDITS_KEY, true);
    expect(result).toEqual({ key: REQUIRES_CREDITS_KEY, value: true });
  });
});
