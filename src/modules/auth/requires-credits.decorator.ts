import { SetMetadata } from '@nestjs/common';

export const REQUIRES_CREDITS_KEY = 'requiresCredits';
export const RequiresCredits = () => SetMetadata(REQUIRES_CREDITS_KEY, true);
