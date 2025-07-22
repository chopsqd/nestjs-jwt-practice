import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const Cookie = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const cookies = request.cookies || {};
    return key ? cookies[key] : cookies;
  }
);