import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { LoginDTO, RegisterDTO } from "@auth/dto";
import { AuthService } from "@auth/auth.service";
import { Tokens } from "@auth/interfaces";
import { Cookie, PublicRoute, UserAgent } from "@shared/decorators";
import { UserResponseDTO } from "@user/dto";
import { GUARDS } from "@auth/guards";
import { catchError, map, mergeMap, Observable, timeout, TimeoutError } from "rxjs";
import { Provider } from "@generated/prisma";

@PublicRoute()
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Post("register")
  public async register(
    @Body() dto: RegisterDTO
  ): Promise<UserResponseDTO> {
    const user = await this.authService.register(dto);
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
  ): Promise<void> {
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

  @UseGuards(GUARDS.GoogleGuard)
  @Get('google')
  googleAuth() {}

  @UseGuards(GUARDS.GoogleGuard)
  @Get('google/callback')
  googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response
  ): void {
    if (!req.user) {
      return res.status(401).redirect('http://localhost:3000/api/auth/failure-google');
    }

    const token = req.user['accessToken']
    return res.redirect(`http://localhost:3000/api/auth/success-google?token=${token}`)
  }

  @Get('success-google')
  successGoogle(
    @Query('token') token: string,
    @UserAgent() agent: string,
    @Res() res: Response
  ): Observable<Response> {
    return this.httpService.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`).pipe(
      timeout(5000),
      mergeMap(({ data: { email } }) =>
        this.authService.providerAuth(email, agent, Provider.GOOGLE)
      ),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new HttpException(err.message, HttpStatus.REQUEST_TIMEOUT);
        }
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
      }),
      map((tokens) => {
        this.setRefreshTokenToCookies(tokens, res);
        return res.status(HttpStatus.OK);
      })
    );
  }

  @UseGuards(GUARDS.YandexGuard)
  @Get('yandex')
  yandexAuth() {}

  @UseGuards(GUARDS.YandexGuard)
  @Get('yandex/callback')
  yandexAuthCallback(
    @Req() req: Request,
    @Res() res: Response
  ): void {
    if (!req.user) {
      return res.status(401).redirect('http://localhost:3000/api/auth/failure-yandex');
    }

    const token = req.user['accessToken']
    return res.redirect(`http://localhost:3000/api/auth/success-yandex?token=${token}`)
  }

  @Get('success-yandex')
  successYandex(
    @Query('token') token: string,
    @UserAgent() agent: string,
    @Res() res: Response
  ): Observable<Response> {
    return this.httpService.get(`https://login.yandex.ru/info?format=json&oauth_token=${token}`).pipe(
      timeout(5000),
      mergeMap(({ data: { email } }) =>
        this.authService.providerAuth(email, agent, Provider.YANDEX)
      ),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new HttpException(err.message, HttpStatus.REQUEST_TIMEOUT);
        }
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
      }),
      map((tokens) => {
        this.setRefreshTokenToCookies(tokens, res);
        return res.status(HttpStatus.OK);
      })
    );
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
