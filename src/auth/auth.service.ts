import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException
} from "@nestjs/common";
import { LoginDTO, RegisterDTO } from "@auth/dto";
import { UserService } from "@user/user.service";
import { Tokens } from "@auth/interfaces";
import { compareSync } from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { Provider, Token, User } from "@generated/prisma";
import { PrismaService } from "@prisma/prisma.service";
import { v4 } from "uuid";
import { add } from "date-fns";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService
  ) {}

  public async register(dto: RegisterDTO): Promise<User> {
    const existingUser = await this.userService.findOne(dto.email).catch(err => {
      this.logger.error(err);
      return null;
    });

    if (existingUser) {
      throw new ConflictException("Пользователь с таким email уже существует");
    }

    const newUser = await this.userService.save(dto).catch(err => {
      this.logger.error(err);
      return null;
    });

    if (!newUser) {
      throw new BadRequestException("Не удалось зарегистрировать пользователя");
    }

    return newUser;
  }

  public async login(dto: LoginDTO, agent: string): Promise<Tokens> {
    const user = await this.userService.findOne(dto.email, true).catch(err => {
      this.logger.error(err);
      return null;
    });

    if (!user || !user.password || !compareSync(dto.password, user.password)) {
      throw new UnauthorizedException("Не верный логин или пароль");
    }

    return this.generateTokens(user, agent);
  }

  public async logout(token: string): Promise<Token> {
    const result = await  this.prismaService.token.delete({
      where: { token }
    });

    if (!result) {
      throw new UnauthorizedException("Токен недействителен или истёк");
    }

    return result
  }

  public async refreshTokens(refreshToken: string, agent: string): Promise<Tokens> {
    const token = await this.prismaService.token.delete({
      where: { token: refreshToken }
    });

    if (!token || new Date(token.exp) < new Date()) {
      throw new UnauthorizedException("Токен недействителен или истёк");
    }

    const user = await this.userService.findOne(token.userId);
    if (!user) {
      throw new UnauthorizedException("Пользователь не найден");
    }

    return this.generateTokens(user, agent);
  }

  public async providerAuth(email: string, agent: string, provider: Provider): Promise<Tokens> {
    const user = await this.prismaService.user.upsert({
      where: { email },
      update: { provider }, // Обновляем провайдер если пользователь существует
      create: { email, provider } // Создаем если не существует
    }).catch(err => {
      this.logger.error(err);
      return null;
    });

    if (!user) {
      throw new HttpException(
        `Не удалось войти через ${provider} Auth`,
        HttpStatus.BAD_REQUEST
      );
    }

    return this.generateTokens(user, agent);
  }

  private async generateTokens(user: User, agent: string): Promise<Tokens> {
    const accessToken = "Bearer " + this.jwtService.sign({
      id: user.id,
      email: user.email,
      roles: user.roles
    });
    const refreshToken = await this.getRefreshToken(user.id, agent);

    return { accessToken, refreshToken };
  }

  private async getRefreshToken(userId: string, agent: string): Promise<Token> {
    const existingToken = await this.prismaService.token.findFirst({
      where: {
        userId,
        userAgent: agent
      }
    })

    const token = existingToken?.token ?? '';

    return this.prismaService.token.upsert({
      where: { token },
      update: {
        token: v4(),
        exp: add(new Date(), { months: 1 })
      },
      create: {
        token: v4(),
        exp: add(new Date(), { months: 1 }),
        userId,
        userAgent: agent
      }
    });
  }
}
