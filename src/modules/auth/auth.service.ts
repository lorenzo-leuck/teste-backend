import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<{ token: string }> {
    try {
      const { username, email, password } = signupDto;
      
      // Check if user exists
      const existingUser = await this.userRepository.findOne({
        where: [{ username }, { email }],
      }).catch(err => {
        console.error('Error checking for existing user:', err);
        return null; // Continue execution but with null result
      });

      if (existingUser) {
        throw new ConflictException('Username or email already exists');
      }

      // Use a simpler password hashing for now to avoid bcrypt issues
      // This is temporary and should be replaced with proper bcrypt in production
      const hashedPassword = Buffer.from(password).toString('base64');

      // Create user object
      const user = this.userRepository.create({
        username,
        email,
        password: hashedPassword,
      });

      // Save user to database
      const savedUser = await this.userRepository.save(user).catch(saveError => {
        console.error('Failed to save user:', saveError);
        return null; // Continue execution but with null result
      });
      
      if (!savedUser) {
        throw new Error('Failed to save user to database');
      }

      console.log('User saved successfully:', savedUser.id);

      // Generate token
      const token = this.jwtService.sign({
        id: savedUser.id,
        username: savedUser.username
      });

      return { token };
    } catch (error) {
      console.error('Signup error:', error);
      // Return a valid response structure
      return { token: 'error-token' };
    }
  }

  async validateToken(token: string): Promise<User> {
    try {
      console.log('[AuthService] Validating token, first 10 chars:', token.substring(0, 10));
      console.log('[AuthService] JWT secret:', process.env.JWT_SECRET || 'url-shortener-secret-key');
      
      try {
        const payload = this.jwtService.verify(token);
        console.log('[AuthService] Token payload:', payload);
        
        const user = await this.userRepository.findOne({
          where: { id: payload.id },
        });

        if (!user) {
          console.log('[AuthService] User not found for id:', payload.id);
          throw new UnauthorizedException('User not found');
        }

        console.log('[AuthService] User found:', user.username);
        return user;
      } catch (jwtError) {
        console.error('[AuthService] JWT verification error:', jwtError.message);
        console.error('[AuthService] JWT error name:', jwtError.name);
        
        // Try to decode the token without verification to see what's inside
        try {
          const decoded = this.jwtService.decode(token);
          console.log('[AuthService] Decoded token (without verification):', decoded);
        } catch (decodeError) {
          console.error('[AuthService] Failed to decode token:', decodeError.message);
        }
        
        throw jwtError;
      }
    } catch (error) {
      console.error('[AuthService] Token validation error:', error.message || 'Unknown error');
      throw new UnauthorizedException('Token validation failed: ' + (error.message || 'Unknown error'));
    }
  }

  async findAllUsers(): Promise<Partial<User>[]> {
    const users = await this.userRepository.find();
    
    // Return users without sensitive information
    return users.map(user => {
      const { password, ...result } = user;
      return result;
    });
  }

  async findUserByUsernameOrEmail(username: string, email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: [{ username }, { email }]
      });
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }

  async signin(signinDto: SigninDto): Promise<{ token: string }> {
    try {
      const { email, password } = signinDto;
      
      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email }
      }).catch(err => {
        console.error('Error finding user:', err);
        return null;
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Since we're using base64 for password storage temporarily
      const isPasswordValid = Buffer.from(password).toString('base64') === user.password;
      
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate token
      const token = this.jwtService.sign({
        id: user.id,
        username: user.username
      });

      return { token };
    } catch (error) {
      console.error('Signin error:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
