import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class RenewUrlDto {
  @ApiProperty({
    description: 'New expiration duration in seconds',
    example: 30,
    required: false
  })
  @IsNumber()
  @IsOptional()
  expirationDuration?: number;
}
