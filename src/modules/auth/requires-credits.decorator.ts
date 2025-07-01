import { SetMetadata } from '@nestjs/common';

export const RequiresCredits = () => SetMetadata('requiresCredits', true);
