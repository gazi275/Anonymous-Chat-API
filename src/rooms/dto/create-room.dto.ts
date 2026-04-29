import { Length, Matches } from 'class-validator';

export class CreateRoomDto {
  @Length(3, 32)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'name can contain only alphanumeric characters and hyphens',
  })
  name!: string;
}