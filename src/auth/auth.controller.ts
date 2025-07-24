import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
  UseInterceptors
} from "@nestjs/common";
import { Response } from "express";
import { LoginDTO, RegisterDTO } from "@auth/dto";
import { AuthService } from "@auth/auth.service";
import { Tokens } from "@auth/interfaces";
import { ConfigService } from "@nestjs/config";
import { Cookie, PublicRoute, UserAgent } from "@shared/decorators";
import { UserResponseDTO } from "@user/dto";

@PublicRoute()
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Post("register")
  public async register(
    @Body() dto: RegisterDTO
  ): Promise<UserResponseDTO> {
    const user = await this.authService.register(dto);
    if (!user) {
      throw new BadRequestException("Не удалось зарегистрировать пользователя");
    }

    return new UserResponseDTO(user);
  }

  @Post("login")
  public async login(
    @Body() dto: LoginDTO,
    @Res() res: Response,
    @UserAgent() agent: string
  ): Promise<void> {
    const tokens = await this.authService.login(dto, agent);
    if (!tokens) {
      throw new BadRequestException("Не удалось авторизовать пользователя");
    }

    this.setRefreshTokenToCookies(tokens, res);
  }

  @Get("logout")
  public async logout(
    @Cookie("Refresh-Token") refreshToken: string,
    @Res() res: Response
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    await this.authService.logout(refreshToken);

    res.cookie("Refresh-Token", "", { httpOnly: true, expires: new Date(), secure: true });
    res.sendStatus(HttpStatus.OK);
  }

  @Get("refresh-tokens")
  public async refreshTokens(
    @Cookie("Refresh-Token") refreshToken: string,
    @Res() res: Response,
    @UserAgent() agent: string
  ): Promise<void> {
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const tokens = await this.authService.refreshTokens(refreshToken, agent);
    if (!tokens) {
      throw new UnauthorizedException();
    }

    this.setRefreshTokenToCookies(tokens, res);
  }

  private setRefreshTokenToCookies(
    tokens: Tokens,
    res: Response
  ): void {
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
