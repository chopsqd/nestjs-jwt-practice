import { Injectable } from '@nestjs/common';
import { genSaltSync, hashSync } from "bcrypt";
import { PrismaService } from "@prisma/prisma.service";
import { User } from "@generated/prisma";

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  private hashPassword(password: string) {
    return hashSync(password, genSaltSync(10))
  }

  public save(user: Pick<User, 'email' | 'password'>) {
    const hashedPassword = this.hashPassword(user.password)

    return this.prismaService.user.create({
      data: {
        email: user.email,
        password: hashedPassword,
        roles: ['USER']
      }
    })
  }

  public findOne(idOrEmail: string) {
    return this.prismaService.user.findFirst({
      where: {
        OR: [{ id: idOrEmail }, { email: idOrEmail }]
      }
    })
  }

  public delete(id: string) {
    return this.prismaService.user.delete({
      where: { id }
    })
  }
}
