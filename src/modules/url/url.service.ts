import { Injectable, ConflictException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as QRCode from 'qrcode';
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
    const { originalUrl, expirationDuration } = createUrlDto;

    // Check user limits if authenticated
    if (user) {
      const userEntity = await this.userRepository.findOne({ where: { id: user.id } });
      if (!userEntity) {
        throw new BadRequestException('User not found');
      }
      
      if (userEntity.usage >= userEntity.credits) {
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
    
    // Set expiration date if provided
    if (expirationDuration && expirationDuration > 0) {
      const expiresAt = new Date();
      // Convert seconds to milliseconds for internal processing
      const milliseconds = expirationDuration * 1000;
      expiresAt.setTime(expiresAt.getTime() + milliseconds);
      url.expiresAt = expiresAt;
    }
    
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
    
    // Check if URL has expired
    if (url.expiresAt && new Date() > url.expiresAt) {
      throw new NotFoundException(`URL with short code ${shortCode} has expired`);
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

  async softDelete(id: string, userId: string): Promise<void> {
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
      throw new ForbiddenException('You can only delete your own URLs');
    }
    
    url.isDeleted = true;
    url.updatedAt = new Date();
    
    await this.urlRepository.save(url);
  }

  async renewExpiration(id: string, userId: string, expirationDuration?: number): Promise<Url> {
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
      throw new ForbiddenException('You can only renew your own URLs');
    }
    
    if (expirationDuration && expirationDuration > 0) {
      const expiresAt = new Date();
      // Convert seconds to milliseconds for internal processing
      const milliseconds = expirationDuration * 1000;
      expiresAt.setTime(expiresAt.getTime() + milliseconds);
      url.expiresAt = expiresAt;
    } else if (url.expiresAt) {
      // If no new duration provided but URL had an expiration, extend by default period (24 hours)
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + (24 * 60 * 60 * 1000)); // 24 hours in milliseconds
      url.expiresAt = expiresAt;
    }
    
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

  async generateQRCode(shortCode: string, format: string = 'png'): Promise<Buffer> {
    // Find the URL by short code
    const url = await this.findByShortCode(shortCode);
    
    // Construct the full short URL with domain
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const shortUrl = `${baseUrl}/${url.shortCode}`;
    
    // Generate QR code as buffer
    const options = {
      type: format === 'jpeg' ? 'image/jpeg' : 'image/png',
      margin: 1,
      width: 300,
      errorCorrectionLevel: 'M'
    };
    
    return QRCode.toBuffer(shortUrl, options);
  }
}
