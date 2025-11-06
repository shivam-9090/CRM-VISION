import { IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';

export class RegisterWithInviteDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))[^\d\W_].*$/, {
    message:
      'Password too weak. It must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
