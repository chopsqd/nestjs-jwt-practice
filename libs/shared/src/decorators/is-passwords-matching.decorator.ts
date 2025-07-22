import { RegisterDTO } from "@auth/dto";
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'IsPasswordsMatching', async: false })
export class IsPasswordsMatching implements ValidatorConstraintInterface {
  validate(passwordRepeat: string, args: ValidationArguments) {
    const obj = args.object as RegisterDTO;
    return obj.password === passwordRepeat;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'Пароли не совпадают';
  }
}