import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "@prisma/prisma.module";
import { UserModule } from "@user/user.module";
import { AuthModule } from "@auth/auth.module";
import { GUARDS } from "@auth/guards";

@Module({
  imports: [UserModule, PrismaModule, AuthModule, ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    { provide: APP_GUARD, useClass: GUARDS.JwtAuthGuard }
  ]
})
export class AppModule {}