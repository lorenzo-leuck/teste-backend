import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateQrCodeDto {
  @ApiProperty({
    description: 'The short code of the URL',
    example: 'abc123',
  })
  @IsString()
  shortCode: string;

  @ApiProperty({
    description: 'The image format for the QR code (png or jpeg)',
    example: 'png',
    default: 'png',
    enum: ['png', 'jpeg'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['png', 'jpeg'])
  format?: string = 'png';
}
