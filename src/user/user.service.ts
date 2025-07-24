import { genSaltSync, hashSync } from "bcrypt";
import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from 'cache-manager';
import { Role, User } from "@generated/prisma";
import { PrismaService } from "@prisma/prisma.service";
import { JwtPayload } from "@auth/interfaces";
import { ConfigService } from "@nestjs/config";
import { convertToSecondsUtil } from "@shared/utils";

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private hashPassword(password: string) {
    return hashSync(password, genSaltSync(10));
  }

  public save(user: Pick<User, "email" | "password">) {
    const hashedPassword = this.hashPassword(user.password);

    return this.prismaService.user.create({
      data: {
        email: user.email,
        password: hashedPassword,
        roles: ["USER"]
      }
    });
  }

  public async findOne(idOrEmail: string, isReset: boolean = false) {
    if (isReset) {
      await this.cacheManager.del(idOrEmail)
    }

    const cacheUser = await this.cacheManager.get<User>(idOrEmail);
    if (!cacheUser) {
      const dbUser = await this.prismaService.user.findFirst({
        where: {
          OR: [{ id: idOrEmail }, { email: idOrEmail }]
        }
      });

      if (!dbUser) {
        return null
      }

      await this.cacheManager.set(
        idOrEmail,
        dbUser,
        convertToSecondsUtil(this.configService.get('JWT_EXP', '5m'))
      );
      return dbUser
    }

    return cacheUser;
  }

  public async delete(id: string, user: JwtPayload) {
    if (user.id !== id && !user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException();
    }

    await Promise.all([
      this.cacheManager.del(id),
      this.cacheManager.del(user.email)
    ]);

    return this.prismaService.user.delete({
      where: { id }
    });
  }
}
