import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateUrlDto {
  @ApiProperty({
    description: 'The original URL to be shortened',
    example: 'https://www.example.com/very/long/path/to/resource'
  })
  @IsUrl()
  @IsNotEmpty()
  originalUrl: string;

  @ApiProperty({
    description: 'Expiration duration in seconds (optional)',
    example: 30,
    required: false
  })
  @IsNumber()
  @IsOptional()
  expirationDuration?: number;
}
