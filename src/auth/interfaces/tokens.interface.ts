import { Token } from "@generated/prisma";

export interface Tokens {
  accessToken: string
  refreshToken: Token
}

export interface JwtPayload {
  id: string
  email: string
  roles: string[]
}