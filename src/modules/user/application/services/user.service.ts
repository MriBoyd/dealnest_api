import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from '../../presentation/dto/create-user.dto';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/common/enums/role.enum';
import { randomBytes } from 'crypto';
import { EmailService } from 'src/modules/auth/infrastructure/adapters/email.service';


@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
		private emailService: EmailService
	) { }


	async create(createUserDto: CreateUserDto): Promise<User> {
		const { phone_number, email, password, role, name } = createUserDto;

		// Prevent self-registering as ADMIN
		if (role === Role.ADMIN) {
			throw new BadRequestException('You cannot self-register as an admin.');
		}

		const existing = await this.usersRepository.findOne({
			where: [{ phone_number: phone_number || undefined }, { email }],
		});
		
		if (existing) {
			throw new ConflictException('User already exists.');
		}

		const password_hash = await bcrypt.hash(password, 10);

		const user = this.usersRepository.create({
			phone_number,
			email,
			password_hash,
			name,
			role,
		});

		await this.generateEmailVerificationToken(user);

		return this.usersRepository.save(user);
	}

	async generateEmailVerificationToken(user: User) {
		const token = randomBytes(32).toString('hex');
		const expires = new Date(Date.now() + 1000 * 60 * 60);

		user.email_verification_token = token;
		user.email_verification_expires = expires;
		await this.usersRepository.save(user);

		await this.emailService.sendVerificationEmail(user.email, token);
	}

	// use email and token to verify
	async verifyEmail(email: string, token: string) {
		const user = await this.findUserByEmail(email);

		if (!user) throw new NotFoundException('Invalid token');
		if (!user.email_verification_expires || user.email_verification_expires < new Date()) {
			throw new BadRequestException('Token expired');
		}

		user.is_email_verified = true;
		user.email_verification_token = null;
		user.email_verification_expires = null;
		await this.usersRepository.save(user);

		return { message: 'Email verified successfully' };
	}

	async resendVerificationEmail(email: string): Promise<void> {
		const user = await this.findUserByEmail(email);
		if (!user) throw new NotFoundException('User not found');

		if (user.is_email_verified) {
			throw new BadRequestException('Email already verified');
		}

		// Rate limiting: allow only once every 10 minutes
		const now = new Date();
		if (
			user.last_verification_email_sent &&
			now.getTime() - user.last_verification_email_sent.getTime() < 10 * 60 * 1000
		) {
			throw new BadRequestException('Please wait before requesting again');
		}

		// Generate token
		const token = randomBytes(32).toString('hex');
		user.email_verification_token = token;
		user.email_verification_expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
		user.last_verification_email_sent = now;
		await this.usersRepository.save(user);

		// Send email
		await this.emailService.sendVerificationEmail(user.email, token);
	}

	async update(id: string, attrs: Partial<User>): Promise<User> {
		const user = await this.findUserById(id);
		if (!user) {
			throw new NotFoundException(`User with id ${id} not found`);
		}

		Object.assign(user, attrs);
		return this.usersRepository.save(user);
	}

	async findUserById(id: string): Promise<User> {
		const user = await this.usersRepository.findOne({ where: { id } });
		if (!user) {
			throw new NotFoundException(`User with id ${id} not found`);
		}
		return user;
	}

	async findUserByEmail(email: string): Promise<User> {
		const user = await this.usersRepository.findOne({ where: { email } });
		if (!user) {
			throw new NotFoundException(`User with email ${email} not found`);
		}
		return user;

	}


}
