import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { genderEnum } from '../../../db/schema/worker.js';

export class WorkerUpdateDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;

  @IsOptional()
  @IsUUID()
  yearId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

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

  @IsOptional()
  @IsIn([...genderEnum.enumValues])
  gender?: (typeof genderEnum.enumValues)[number];

  @IsOptional()
  @IsString()
  phone?: string;
}
