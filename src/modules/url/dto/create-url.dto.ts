import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty, IsString } from 'class-validator';

export class CreateUrlDto {
  @ApiProperty({
    description: 'The original URL to be shortened',
    example: 'https://www.example.com/very/long/path/to/resource'
  })
  @IsUrl()
  @IsNotEmpty()
  originalUrl: string;
}
