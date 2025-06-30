import { ApiProperty } from '@nestjs/swagger';

export class MockResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'hi John Doe'
  })
  message: string;
}
