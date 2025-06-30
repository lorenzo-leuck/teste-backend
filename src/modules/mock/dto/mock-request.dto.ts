import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MockRequestDto {
  @ApiProperty({
    description: 'Name field for the mock request',
    example: 'John Doe',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
