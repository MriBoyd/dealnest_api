import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/modules/user/application/services/user/user.service';

type user = {
  email: string;
  password: string;
};

type SignInData = {
  id: string;
  name: string;
  email: string;
};

type AuthData = {
  id: string;
  name: string;
  email: string;
  accessToken: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) { }

  authenticate(user: user): Promise<AuthData | null> {
    const userFound = this.validateUser(user);

    if (userFound) {
      return Promise.resolve({
        id: userFound.id,
        name: userFound.name,
        email: userFound.email,
        accessToken: 'token',
      });
    }
    
    throw new UnauthorizedException();
  }

  validateUser(user: user): SignInData | null {
    const userFound = this.userService.findUserByEmail(user.email);
    if (userFound && userFound.password === user.password) {
      return {
        id: userFound.id,
        name: userFound.name,
        email: userFound.email,
      } as SignInData;
    }
    return null;
  }
}
