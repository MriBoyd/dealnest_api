import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../application/services/user.service';
import { User } from '../../domain/entities/user.entity';
import { EmailService } from '../../../email/application/services/email.service';
import { CreateUserDto } from '../../presentation/dto/create-user.dto';
import { Role } from '../../../../common/enums/role.enum';
import { UserResponseDto } from '../../presentation/dto/user-response.dto';
import { UserMapper } from '../../application/mappers/user.mapper';
import { UpdateProfileDto } from '../../presentation/dto/update-profile.dto';
import { ChangePasswordDto } from '../../presentation/dto/change-password.dto';

jest.mock('bcrypt');
jest.mock('../../../email/application/services/email.service');
jest.mock('../../application/mappers/user.mapper');

describe('UserService', () => {
  let service: UserService;
  let userRepo: Repository<User>;
  let emailService: EmailService;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const mockEmailService = {
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    generateAndSendVerificationToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: Role.INDIVIDUAL_BUYER,
      phone_number: '1234567890',
    };

    it('should create a user successfully', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockUserRepo.create.mockReturnValue({ ...createUserDto, id: '1' });
      mockUserRepo.save.mockResolvedValue({ ...createUserDto, id: '1' });
      (UserMapper.toResponse as jest.Mock).mockReturnValue({} as UserResponseDto);

      const result = await service.createUser(createUserDto);

      expect(result).toBeDefined();
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: [{ phone_number: '1234567890' }, { email: 'test@example.com' }],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserRepo.create).toHaveBeenCalled();
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(emailService.generateAndSendVerificationToken).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: '1' });
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException for short password', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createUser({ ...createUserDto, password: '123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // Email verification is now handled by EmailService, not UserService.

  describe('updateProfile', () => {
    const userId = '1';
    const updateProfileDto: UpdateProfileDto = { name: 'Updated Name' };
    const user = { id: userId, name: 'Old Name' };

    it('should update a user profile', async () => {
      mockUserRepo.findOne.mockResolvedValue(user);
      mockUserRepo.save.mockImplementation(u => Promise.resolve(u));

      const result = await service.updateProfile(userId, updateProfileDto);

      expect(result.name).toEqual('Updated Name');
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.updateProfile(userId, updateProfileDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProfile', () => {
    const userId = '1';
    const user = { id: userId };

    it('should delete a user profile', async () => {
      mockUserRepo.findOne.mockResolvedValue(user);
      mockUserRepo.remove.mockResolvedValue(undefined);

      await service.deleteProfile(userId);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockUserRepo.remove).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteProfile(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    const userId = '1';
    const changePasswordDto: ChangePasswordDto = { current_password: 'password123', new_password: 'newpassword' };
    const user = { id: userId, password_hash: 'hashedpassword' };

    it('should change the password successfully', async () => {
      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpassword');
      mockUserRepo.save.mockResolvedValue({ ...user, password_hash: 'newhashedpassword' });

      const result = await service.changePassword(userId, changePasswordDto);

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(mockUserRepo.save).toHaveBeenCalledWith(expect.objectContaining({ password_hash: 'newhashedpassword' }));
    });

    it('should throw UnauthorizedException for incorrect current password', async () => {
      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});