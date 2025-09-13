import { Injectable } from '@nestjs/common';

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

const user: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: '3oZKU@example.com',
    password: '123456',
  },
  {
    id: '2',
    name: 'Jane Doe',
    email: '4s0Hd@example.com',
    password: '123456',
  },
];

@Injectable()
export class UserService {
  findUserByName(name: string): User | undefined {
    return user.find((user) => user.name === name);
  }

  findUserByEmail(email: string): User | undefined {
    return user.find((user) => user.email === email);
  }
}
