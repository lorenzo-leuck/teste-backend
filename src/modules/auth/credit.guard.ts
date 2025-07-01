import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class CreditGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresCredits = this.reflector.get<boolean>('requiresCredits', context.getHandler());
    if (!requiresCredits) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }
    
    const userEntity = await this.userRepository.findOne({ where: { id: user.id } });
    if (!userEntity) {
      throw new ForbiddenException('User not found');
    }
    
    if (userEntity.credits <= 0) {
      throw new ForbiddenException('Insufficient credits');
    }
    
    return true;
  }
}
