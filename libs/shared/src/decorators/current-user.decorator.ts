import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "@auth/interfaces";

export const CurrentUser = createParamDecorator(
  (key: keyof JwtPayload, ctx: ExecutionContext): Partial<JwtPayload> => {
    const request = ctx.switchToHttp().getRequest();
    return key ? request.user[key] : request.user;
})