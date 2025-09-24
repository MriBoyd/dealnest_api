// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/enums/role.enum';
import { UserService } from 'src/modules/user/application/services/user.service';
import { User } from 'src/modules/user/domain/entities/user.entity';

@Injectable()
export class AuthService {
	constructor(
		private usersService: UserService,
		private jwtService: JwtService,
	) { }

	async validateUser(email: string, password: string): Promise<User> {
		const user = await this.usersService.findUserByEmail(email);
		console.log('user', user);
		if (!user || !user.password_hash) {
			throw new UnauthorizedException('Invalid phone or password');
		}

		const valid = await bcrypt.compare(password, user.password_hash);
		if (!valid) {
			throw new UnauthorizedException('Invalid phone or password');
		}

		return user;
	}

	async validateOAuthLogin(email: string, name: string) {
		let user = await this.usersService.findUserByEmail(email);
		if (!user) {
			user = await this.usersService.create({
				email,
				name,
				phone_number: null,
				password: null,
				role: Role.INDIVIDUAL_BUYER,
				is_email_verified: true, 
			});
		}
		return user;
	}


	async login(user: User) {
		const payload = { sub: user.id, role: user.role };
		return {
			access_token: this.jwtService.sign(payload),
			user: {
				id: user.id,
				phone_number: user.phone_number,
				email: user.email,
				name: user.name,
				role: user.role,
			},
		};
	}
}
