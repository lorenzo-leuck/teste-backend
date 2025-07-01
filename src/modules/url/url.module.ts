import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { Url } from '../../entities/url.entity';
import { User } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Url, User]),
    AuthModule
  ],
  controllers: [UrlController],
  providers: [UrlService],
  exports: [UrlService]
})
export class UrlModule {}
