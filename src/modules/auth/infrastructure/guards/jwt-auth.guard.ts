
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	canActivate(context: ExecutionContext) {
		const req = context.switchToHttp().getRequest();
		return super.canActivate(context);
	}

	handleRequest(err, user, info, context) {
		if (err || !user) {
			throw new UnauthorizedException('Unauthorized');
		}
		return user;
	}
}
