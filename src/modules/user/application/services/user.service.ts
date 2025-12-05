import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../../presentation/dto/create-user.dto';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailService as AppEmailService } from '../../../email/application/services/email.service';
import { UserResponseDto } from '../../presentation/dto/user-response.dto';
import { UserMapper } from '../mappers/user.mapper';
import {
	DEFAULT_PROFILE_PIC_BASE64,
	DEFAULT_PROFILE_PIC_MIMETYPE,
} from '../../../../config/defaults';
import { UpdateProfileDto } from '../../presentation/dto/update-profile.dto';
import { ChangePasswordDto } from '../../presentation/dto/change-password.dto';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		// Inject new dedicated email verification service
		private readonly emailService: AppEmailService,
	) { }

	async createUser(
		createUserDto: CreateUserDto,
		isOAuth = false,
	): Promise<UserResponseDto> {
		const { phone_number, email, password, name, business_name } = createUserDto;

		const existing = await this.userRepo.findOne({
			where: [{ phone_number: phone_number || undefined }, { email }],
		});

		if (existing) {
			throw new ConflictException('User already exists.');
		}

		let password_hash: string | undefined = undefined;
		let is_email_verified = false;

		// If password is provided, treat as non-OAuth (require password, do not allow verified)
		if (password) {
			if (!password || password.length < 8) {
				throw new BadRequestException(
					'Password is required and must be at least 8 characters.',
				);
			}
			if (createUserDto.is_email_verified) {
				// Never allow client to set this
				throw new BadRequestException(
					'is_email_verified must be false for password-based registration.',
				);
			}
			password_hash = await bcrypt.hash(password, 10);
			is_email_verified = false; // Never allow client to set this for password-based
		} else {
			// Only allow is_email_verified for OAuth if called from trusted OAuth flow
			if (!isOAuth) {
				throw new BadRequestException(
					'registration without password is not allowed.',
				);
			}
			is_email_verified = !!createUserDto.is_email_verified;
			if (!is_email_verified) {
				throw new BadRequestException(
					'OAuth registration must set is_email_verified to true.',
				);
			}
		}

		const newUser = this.userRepo.create({
			phone_number,
			email,
			password_hash,
			name,
			business_name,
			role: createUserDto.role,
			is_email_verified,
		});

		const saved = await this.userRepo.save(newUser);

		if (password) {
			await this.emailService.generateAndSendVerificationToken(saved);
		}

		return UserMapper.toResponse(saved);
	}

	// Email verification logic has been extracted to EmailVerificationService.
	// Legacy methods removed for a cleaner, single‑responsibility UserService.

	async update(id: string, attrs: Partial<User>): Promise<User> {
		const user = await this.findUserById(id);
		if (!user) {
			throw new NotFoundException(`User with id ${id} not found`);
		}

		Object.assign(user, attrs);
		return this.userRepo.save(user);
	}

	async findUserById(id: string): Promise<User> {
		const user = await this.userRepo.findOne({ where: { id } });
		if (!user) {
			throw new NotFoundException(`User with id ${id} not found`);
		}
		return user;
	}

	async findUserByEmail(email: string): Promise<User | null> {
		const user = await this.userRepo.findOne({
			where: { email: email.toLowerCase() },
		});
		if (!user) {
			throw new NotFoundException(`User with email ${email} not found`);
		}
		return user;
	}

	async uploadProfilePicBase64(
		userId: string,
		base64: string,
		mimetype: string,
	): Promise<UserResponseDto> {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) throw new NotFoundException('User not found');

		const buffer = Buffer.from(base64, 'base64');

		user.profile_pic_mimetype = mimetype;
		user.profile_pic_data = buffer;

		await this.userRepo.save(user);

		return UserMapper.toResponse(user);
	}

	async getProfilePic(
		userId: string,
	): Promise<{ mimetype: string; base64: string }> {
		const user = await this.userRepo.findOne({ where: { id: userId } });

		if (!user || !user.profile_pic_data) {
			throw new NotFoundException('Profile picture not found');
		}

		return {
			mimetype: user.profile_pic_mimetype ?? DEFAULT_PROFILE_PIC_MIMETYPE,
			base64:
				user.profile_pic_data.toString('base64') ?? DEFAULT_PROFILE_PIC_BASE64,
		};
	}

	async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) throw new NotFoundException('User not found');

		if (dto.profile_pic_base64 && dto.profile_pic_mimetype) {
			const buffer = Buffer.from(dto.profile_pic_base64, 'base64');
			user.profile_pic_data = buffer;
			user.profile_pic_mimetype = dto.profile_pic_mimetype;
		}

		Object.assign(user, {
			name: dto.name ?? user.name,
			business_name: dto.business_name ?? user.business_name,
			phone_number: dto.phone_number ?? user.phone_number,
			preferred_language: dto.preferred_language ?? user.preferred_language,
		});

		return await this.userRepo.save(user);
	}

	async deleteProfile(userId: string): Promise<void> {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) throw new NotFoundException('User not found');
		await this.userRepo.remove(user);
	}

	async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) throw new NotFoundException('User not found');

		if (!user.password_hash)
			throw new BadRequestException('User does not have a password set (social login?)');

		const isValid = await bcrypt.compare(dto.current_password, user.password_hash);
		if (!isValid) throw new UnauthorizedException('Current password is incorrect');

		const newHash = await bcrypt.hash(dto.new_password, 10);
		user.password_hash = newHash;
		await this.userRepo.save(user);

		return { message: 'Password changed successfully' };
	}
}
