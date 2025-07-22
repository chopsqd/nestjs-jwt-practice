import { ConflictException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { LoginDTO, RegisterDTO } from "@auth/dto";
import { UserService } from "@user/user.service";
import { Tokens } from "@auth/interfaces";
import { compareSync } from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { Token, User } from "@generated/prisma";
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
  ) {
  }

  public async register(dto: RegisterDTO) {
    const user = await this.userService.findOne(dto.email).catch(err => {
      this.logger.error(err);
      return null;
    });

    if (user) {
      throw new ConflictException("Пользователь с таким email уже существует");
    }

    return this.userService.save(dto).catch(err => {
      this.logger.error(err);
      return null;
    });
  }

  public async login(dto: LoginDTO): Promise<Tokens> {
    const user = await this.userService.findOne(dto.email).catch(err => {
      this.logger.error(err);
      return null;
    });

    if (!user || !compareSync(dto.password, user.password)) {
      throw new UnauthorizedException("Не верный логин или пароль");
    }

    return this.generateTokens(user);
  }

  public async refreshTokens(refreshToken: string): Promise<Tokens> {
    const token = await this.prismaService.token.findUnique({
      where: { token: refreshToken }
    });

    if (!token || new Date(token.exp) < new Date()) {
      throw new UnauthorizedException("Токен недействителен или истёк");
    }

    await this.prismaService.token.delete({ where: { token: refreshToken } });

    const user = await this.userService.findOne(token.userId);
    if (!user) {
      throw new UnauthorizedException("Пользователь не найден");
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: User): Promise<Tokens> {
    const accessToken = "Bearer " + this.jwtService.sign({
      id: user.id,
      email: user.email,
      roles: user.roles
    });
    const refreshToken = await this.getRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  private async getRefreshToken(userId: string): Promise<Token> {
    return this.prismaService.token.create({
      data: {
        token: v4(),
        exp: add(new Date(), { months: 1 }),
        userId
      }
    });
  }
}
