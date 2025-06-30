import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities';
import { SignupDto } from './dto/signup.dto';

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
      
      // Check if user already exists
      let existingUser;
      try {
        existingUser = await this.userRepository.findOne({
          where: [{ username }, { email }],
        });
      } catch (err) {
        console.error('Error checking for existing user:', err);
        // Instead of returning null, handle the database error properly
        throw new Error(`Database error: ${err.message}`);
      }

      if (existingUser) {
        throw new ConflictException('Username or email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user object
      const user = this.userRepository.create({
        username,
        email,
        password: hashedPassword,
      });

      // Save user to database
      let savedUser;
      try {
        savedUser = await this.userRepository.save(user);
        console.log('User saved successfully:', savedUser.id);
      } catch (saveError) {
        console.error('Failed to save user:', saveError);
        throw new Error(`Failed to save user: ${saveError.message}`);
      }

      // Generate token
      const token = this.jwtService.sign({
        id: savedUser.id,
        username: savedUser.username
      });

      return { token };
    } catch (error) {
      console.error('Signup error:', error);
      // Instead of trying to return a token on error, let the exception filter handle it
      throw error;
    }
  }

  async validateToken(token: string): Promise<User> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userRepository.findOne({
        where: { id: payload.id },
      });

      if (!user) {
        throw new UnauthorizedException();
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException();
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
}
