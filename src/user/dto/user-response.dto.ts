import { Provider, Role, User } from "@generated/prisma";
import { Exclude } from "class-transformer";

export class UserResponseDTO implements User {
  id: string
  email: string

  @Exclude()
  password: string

  @Exclude()
  provider: Provider;

  @Exclude()
  isBlocked: boolean;

  @Exclude()
  createdAt: Date

  updatedAt: Date
  roles: Role[]

  constructor(user: User) {
    if (!user) {
      throw new Error("User cannot be null");
    }
    Object.assign(this, user)
  }
}
