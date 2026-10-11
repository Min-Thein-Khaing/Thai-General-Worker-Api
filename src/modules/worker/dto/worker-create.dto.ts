import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { genderEnum } from '../../../db/schema/worker.js';

export class WorkerCreateDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  managerId!: string;

  @IsUUID()
  yearId!: string;

  @IsUUID()
  companyId!: string;

  @IsOptional()
  @IsString()
  passportNumber?: string;

  @IsOptional()
  @IsString()
  workPermitNumber?: string;

  @IsOptional()
  @IsString()
  ciNumber?: string;

  @IsOptional()
  @IsString()
  typeOfBook?: string;

  @IsIn([...genderEnum.enumValues])
  gender!: (typeof genderEnum.enumValues)[number];

  @IsOptional()
  @IsString()
  phone?: string;
}
