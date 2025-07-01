import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

const mockUser = {
  id: '8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a',
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  limit: 10,
  usage: 5,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn()
          }
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
            verify: jest.fn(),
            decode: jest.fn()
          }
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllUsers', () => {
    it('should return all non-deleted users with sensitive data removed', async () => {
      const users = [mockUser];
      jest.spyOn(userRepository, 'find').mockResolvedValue(users);

      const result = await service.findAllUsers();
      
      expect(result).toEqual([{
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        limit: mockUser.limit,
        usage: mockUser.usage,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      }]);
      expect(userRepository.find).toHaveBeenCalledWith({
        where: { isDeleted: false }
      });
    });
  });

  describe('validateToken', () => {
    it('should validate token and return user if user exists and is not deleted', async () => {
      const token = 'valid-token';
      const payload = { id: mockUser.id, username: mockUser.username };
      
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.validateToken(token);
      
      expect(result).toEqual(mockUser);
      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { 
          id: payload.id,
          isDeleted: false 
        }
      });
    });

    it('should throw UnauthorizedException if user is not found or deleted', async () => {
      const token = 'valid-token';
      const payload = { id: 'non-existent-id', username: 'username' };
      
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.validateToken(token)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signin', () => {
    it('should sign in user and return token if credentials are valid and user is not deleted', async () => {
      const signinDto = { email: mockUser.email, password: 'password123' };
      const hashedPassword = Buffer.from(signinDto.password).toString('base64');
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };
      
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithHashedPassword);
      jest.spyOn(jwtService, 'sign').mockReturnValue('test-token');

      const result = await service.signin(signinDto);
      
      expect(result).toEqual({ token: 'test-token' });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { 
          email: signinDto.email,
          isDeleted: false 
        }
      });
    });

    it('should throw UnauthorizedException if user is not found or deleted', async () => {
      const signinDto = { email: 'nonexistent@example.com', password: 'password123' };
      
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.signin(signinDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findUserByUsernameOrEmail', () => {
    it('should find non-deleted user by username or email', async () => {
      const username = mockUser.username;
      const email = mockUser.email;
      
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findUserByUsernameOrEmail(username, email);
      
      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [
          { username, isDeleted: false },
          { email, isDeleted: false }
        ]
      });
    });
  });

  describe('softDeleteUser', () => {
    it('should soft delete a user if requesting user is the same', async () => {
      const userId = mockUser.id;
      const requestingUserId = mockUser.id;
      const deletedUser = { ...mockUser, isDeleted: true };
      
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(deletedUser);

      await service.softDeleteUser(userId, requestingUserId);
      
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { 
          id: userId,
          isDeleted: false 
        }
      });
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        isDeleted: true
      }));
    });

    it('should throw UnauthorizedException if requesting user is different', async () => {
      const userId = mockUser.id;
      const requestingUserId = 'different-user-id';
      
      await expect(service.softDeleteUser(userId, requestingUserId)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const userId = 'non-existent-id';
      const requestingUserId = userId;
      
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.softDeleteUser(userId, requestingUserId)).rejects.toThrow(UnauthorizedException);
    });
  });
});
