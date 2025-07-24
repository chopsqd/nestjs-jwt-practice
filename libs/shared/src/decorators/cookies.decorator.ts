import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Cookie = createParamDecorator((key: string, ctx: ExecutionContext) => {
  const { cookies = {} } = ctx.switchToHttp().getRequest();

  return key ? (cookies[key] ?? null) : cookies;
});