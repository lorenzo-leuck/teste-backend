import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUrlDto {
  @ApiProperty({
    description: 'The new original URL to redirect to',
    example: 'https://www.newexample.com/updated/path'
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  originalUrl: string;
}
