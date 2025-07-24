import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  UseInterceptors
} from "@nestjs/common";
import { CurrentUser } from "@shared/decorators";
import { UserService } from "@user/user.service";
import { UserResponseDTO } from "@user/dto";
import { JwtPayload } from "@auth/interfaces";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(":idOrEmail")
  async findOneUser(
    @Param("idOrEmail") idOrEmail: string
  ): Promise<UserResponseDTO> {
    const user = await this.userService.findOne(idOrEmail);
    if (!user) {
      throw new BadRequestException("Не удалось зарегистрировать пользователя");
    }

    return new UserResponseDTO(user);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Delete(":id")
  async deleteUser(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: JwtPayload
  ): Promise<UserResponseDTO> {
    const user = await this.userService.delete(id, currentUser);

    return new UserResponseDTO(user);
  }
}
