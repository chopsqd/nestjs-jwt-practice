import { Role, User } from "@generated/prisma";
import { Exclude } from "class-transformer";

export class UserResponseDTO implements User {
  id: string
  email: string

  @Exclude()
  password: string

  @Exclude()
  createdAt: Date

  updatedAt: Date
  roles: Role[]

  constructor(user: User) {
    Object.assign(this, user)
  }
}
