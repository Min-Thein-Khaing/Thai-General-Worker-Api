import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { userRoleEnum } from '../../../db/schema/user.js';

export class UserUpdateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsIn([...userRoleEnum.enumValues])
  role?: (typeof userRoleEnum.enumValues)[number];

  @IsOptional()
  @IsString()
  imageUrl?: string;
}