import { ExecutionContext, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export const PUBLIC_KEY = "public";
export const PublicRoute = () => SetMetadata(PUBLIC_KEY, true);

export const isPublicRoute = (ctx: ExecutionContext, reflector: Reflector) => {
  return reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]);
};