import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Url } from '../../entities/url.entity';
import { User } from '../../entities/user.entity';
import { CreateUrlDto } from './dto/create-url.dto';

@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(Url)
    private urlRepository: Repository<Url>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUrlDto: CreateUrlDto, user?: User): Promise<Url> {
    const { originalUrl } = createUrlDto;

    // Check user limits if authenticated
    if (user) {
      const userEntity = await this.userRepository.findOne({ where: { id: user.id } });
      if (!userEntity) {
        throw new BadRequestException('User not found');
      }
      
      if (userEntity.usage >= userEntity.limit) {
        throw new BadRequestException('URL shortening limit reached');
      }
    }

    // Generate unique 6-character short code
    let shortCode = this.generateShortCode();
    let existingUrl = await this.urlRepository.findOne({ where: { shortCode } });
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (existingUrl && attempts < maxAttempts) {
      shortCode = this.generateShortCode();
      existingUrl = await this.urlRepository.findOne({ where: { shortCode } });
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new ConflictException('Failed to generate unique short code after multiple attempts');
    }

    // Create new URL entity
    const url = new Url();
    url.originalUrl = originalUrl;
    url.shortCode = shortCode;
    url.user = user || null;
    
    const savedUrl = await this.urlRepository.save(url);

    // Update user usage count if authenticated
    if (user) {
      await this.userRepository.increment({ id: user.id }, 'usage', 1);
    }

    return savedUrl;
  }

  async findAll(): Promise<Url[]> {
    return this.urlRepository.find({
      where: { isDeleted: false },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  private generateShortCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const codeLength = 6;
    let result = '';
    
    for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    
    return result;
  }
}
