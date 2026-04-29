import { Length, Matches } from 'class-validator';

export class LoginDto {
  @Length(2, 24)
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: 'username must contain only alphanumeric characters and underscores',
  })
  username!: string;
}