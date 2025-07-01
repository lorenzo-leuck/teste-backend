import { Injectable, ConflictException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async findByUserId(userId: string): Promise<Url[]> {
    return this.urlRepository.find({
      where: { 
        user: { id: userId },
        isDeleted: false 
      },
      order: { createdAt: 'DESC' }
    });
  }

  async findByShortCode(shortCode: string): Promise<Url> {
    const url = await this.urlRepository.findOne({
      where: { 
        shortCode,
        isDeleted: false 
      }
    });
    
    if (!url) {
      throw new NotFoundException(`URL with short code ${shortCode} not found`);
    }
    
    return url;
  }

  async incrementClickCount(shortCode: string): Promise<void> {
    const url = await this.urlRepository.findOne({
      where: { 
        shortCode,
        isDeleted: false 
      }
    });
    
    if (!url) {
      throw new NotFoundException(`URL with short code ${shortCode} not found`);
    }
    
    await this.urlRepository.increment({ id: url.id }, 'clickCount', 1);
  }

  async update(id: string, userId: string, originalUrl: string): Promise<Url> {
    const url = await this.urlRepository.findOne({
      where: { 
        id,
        isDeleted: false 
      },
      relations: ['user']
    });
    
    if (!url) {
      throw new NotFoundException(`URL with ID ${id} not found`);
    }
    
    if (!url.user || url.user.id !== userId) {
      throw new ForbiddenException('You can only update your own URLs');
    }
    
    url.originalUrl = originalUrl;
    url.updatedAt = new Date();
    
    return this.urlRepository.save(url);
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
