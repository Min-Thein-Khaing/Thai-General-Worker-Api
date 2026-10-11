import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ManagerCreateDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  companyId!: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
