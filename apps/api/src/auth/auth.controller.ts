import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';

import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SessionGuard } from '../common/guards/session.guard';
import { SESSION_COOKIE } from '../common/types/request-user';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('guest')
  @HttpCode(HttpStatus.CREATED)
  async signInAsGuest(@Res({ passthrough: true }) response: Response) {
    const { token, user, workspace } = await this.authService.signInAsGuest();
    response.cookie(SESSION_COOKIE, token, this.cookieOptions());
    return { user, workspace, token };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentUser('userId') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(SESSION_COOKIE, { ...this.cookieOptions(), maxAge: undefined });
  }

  private cookieOptions(): CookieOptions {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';

    return {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    };
  }
}
