import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Post, Req,
  Res,
  UnauthorizedException
} from "@nestjs/common";
import { Request, Response } from "express";
import { LoginDTO, RegisterDTO } from "@auth/dto";
import { AuthService } from "@auth/auth.service";
import { Tokens } from "@auth/interfaces";
import { ConfigService } from "@nestjs/config";
import { Cookie, UserAgent } from "@shared/decorators";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Post("register")
  public async register(
    @Body() dto: RegisterDTO
  ) {
    const user = await this.authService.register(dto);
    if (!user) {
      throw new BadRequestException("Не удалось зарегистрировать пользователя");
    }
  }

  @Post("login")
  public async login(
    @Body() dto: LoginDTO,
    @Res() res: Response,
    @UserAgent() agent: string
  ) {
    // const agent = req.headers['user-agent']
    const tokens = await this.authService.login(dto);
    if (!tokens) {
      throw new BadRequestException("Не удалось авторизовать пользователя");
    }

    this.setRefreshTokenToCookies(tokens, res);
  }

  @Get("refresh-tokens")
  public async refreshTokens(
    @Cookie("Refresh-Token") refreshToken: string,
    @Res() res: Response
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    if (!tokens) {
      throw new UnauthorizedException();
    }

    this.setRefreshTokenToCookies(tokens, res);
  }

  private setRefreshTokenToCookies(
    tokens: Tokens,
    res: Response
  ) {
    if (!tokens) {
      throw new UnauthorizedException();
    }

    res.cookie("Refresh-Token", tokens.refreshToken.token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      expires: new Date(tokens.refreshToken.exp),
      secure: this.configService.get("NODE_ENV", "development") === "production"
    });

    res.status(HttpStatus.CREATED).json({ accessToken: tokens.accessToken });
  }
}
