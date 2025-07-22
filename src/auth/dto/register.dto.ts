import { IsEmail, IsString, MinLength, Validate } from "class-validator";
import { IsPasswordsMatching } from "@shared/decorators";

export class RegisterDTO {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string

  @IsString()
  @MinLength(6)
  @Validate(IsPasswordsMatching)
  passwordRepeat: string
}