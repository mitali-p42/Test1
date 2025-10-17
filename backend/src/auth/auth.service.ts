import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async register(email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.users.create(email, passwordHash);
    return this.signToken(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);

    // 404 when the account doesn't exist
    if (!user) {
      throw new NotFoundException('No account found with this email. Please register.');
    }

    // 401 when the password is wrong
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    return this.signToken(user.id, user.email);
  }

  async me(userId: string) {
  const user = await this.users.findByIdWithProfile(userId);
  if (!user) {
    // mirror your frontend defaults if no user found
    return {
      id: null,
      email: null,
      createdAt: null,
      role: '—',
      interviewType: '—',
      yearsOfExperience: '—',
    };
  }

  // user already has camelCase fields from the query builder SELECT ... AS "field"
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    role: user.role ?? '—',
    interviewType: user.interviewType ?? '—',
    yearsOfExperience:
      user.yearsOfExperience ?? '—',
  };
}



  private signToken(sub: string, email: string) {
    const access_token = this.jwt.sign({ sub, email });
    return { access_token };
  }
}
