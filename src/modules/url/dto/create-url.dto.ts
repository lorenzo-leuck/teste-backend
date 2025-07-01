import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateUrlDto {
  @ApiProperty({
    description: 'The original URL to be shortened',
    example: 'https://www.fifa.com/pt/tournaments/mens/club-world-cup/usa-2025/articles/mundial-clubes-tabela-jogos-estadios-grupos'
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
