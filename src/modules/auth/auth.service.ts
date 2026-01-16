import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    console.log('LOGIN EMAIL:', email);

    const user = await this.usersService.findByEmail(email);
    console.log('USER:', user);

    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }

    console.log('HASH:', user.password);

    const isValid = await bcrypt.compare(password, user.password);
    console.log('PASSWORD VALID:', isValid);

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing');
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is missing');
    }
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: Number(process.env.JWT_EXPIRES_IN),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN),
    });

    return {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async register(dto: RegisterDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException('Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      password: hashedPassword,
      role: 'user',
      isActive: true,
    });

    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }
}
