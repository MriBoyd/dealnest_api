// auth/auth.service.ts
import {
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/enums/role.enum';
import { UserMapper } from 'src/modules/user/application/mappers/user.mapper';
import { UserService } from 'src/modules/user/application/services/user.service';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { UserResponseDto } from 'src/modules/user/presentation/dto/user-response.dto';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { RequestPasswordResetDto } from '../../presentation/dto/request-password-reset.dto';
// using native Date arithmetic instead of date-fns to avoid adding a dependency
import { EmailService } from '../../infrastructure/adapters/email.service';
import { ResetPasswordDto } from '../../presentation/dto/reset-password.dto';

@Injectable()
export class AuthService {
	constructor(
		private usersService: UserService,
		private jwtService: JwtService,
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		private readonly mailerService: EmailService,
	) { }

	async validateUser(
		email: string,
		password: string,
	): Promise<UserResponseDto> {
		const user = await this.usersService.findUserByEmail(email);
		if (!user || !user.password_hash) {
			throw new UnauthorizedException('Invalid phone or password');
		}

		const valid = await bcrypt.compare(password, user.password_hash);
		if (!valid) {
			throw new UnauthorizedException('Invalid phone or password');
		}

		return UserMapper.toResponse(user);
	}

	async validateOAuthLogin(email: string, name: string) {
		try {
			const user = await this.usersService.findUserByEmail(email);
			return user;
		} catch (error) {
			if (error instanceof NotFoundException) {
				const user = await this.usersService.createUser(
					{
						email,
						name,
						phone_number: null,
						password: null,
						role: Role.INDIVIDUAL_BUYER,
						is_email_verified: true,
					},
					true,
				);
				return user;
			}
			throw error;
		}
	}

	async login(user: UserResponseDto) {
		const payload = { sub: user.id, email: user.email, role: user.role };
		return {
			access_token: this.jwtService.sign(payload),
			user,
		};
	}

	async requestPasswordReset(dto: RequestPasswordResetDto): Promise<{ message: string }> {
		const user = await this.userRepository.findOne({ where: { email: dto.email } });
		if (!user) return { message: 'If this email exists, a reset link was sent' };

		const token = randomBytes(32).toString('hex');
		user.email_verification_token = token;
		// set expiration to 2 hours from now without external dependency
		user.email_verification_expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
		await this.userRepository.save(user);

		const resetUrl = `https://yourapp.com/reset-password?token=${token}`;
		await this.mailerService.sendPasswordResetEmail(user.email, resetUrl);

		return { message: 'Password reset link sent if email exists' };
	}

	async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
		const user = await this.userRepository.findOne({
			where: { email_verification_token: dto.token },
		});
		if (!user || !user.email_verification_expires)
			throw new UnauthorizedException('Invalid or expired token');

		if (user.email_verification_expires < new Date())
			throw new UnauthorizedException('Token expired');

		const newHash = await bcrypt.hash(dto.new_password, 10);
		user.password_hash = newHash;
		user.email_verification_token = null;
		user.email_verification_expires = null;
		await this.userRepository.save(user);

		return { message: 'Password reset successful' };
	}
}
