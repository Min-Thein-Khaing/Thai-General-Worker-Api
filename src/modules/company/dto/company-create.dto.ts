import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CompanyCreateDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @MinLength(1)
  companyName!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
