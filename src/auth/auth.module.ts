import { Module } from '@nestjs/common';
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "@user/user.module";
import { STRATEGIES } from "@auth/strategies";
import { GUARDS } from "@auth/guards";
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConfig } from "./config";

@Module({
  controllers: [AuthController],
  providers: [AuthService, ...STRATEGIES, ...GUARDS],
  imports: [PassportModule, JwtModule.registerAsync(jwtConfig()), UserModule]
})
export class AuthModule {}
