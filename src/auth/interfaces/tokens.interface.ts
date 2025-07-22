import { Token } from "@generated/prisma";

export interface Tokens {
  accessToken: string
  refreshToken: Token
}