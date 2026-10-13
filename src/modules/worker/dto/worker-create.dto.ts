import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  genderEnum,
  renewalDecisionValues,
} from '../../../db/schema/worker.js';

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

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === ''
      ? undefined
      : value === null
        ? null
        : Number(value),
  )
  @IsInt()
  @Min(0)
  total?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === ''
      ? undefined
      : value === null
        ? null
        : Number(value),
  )
  @IsInt()
  @Min(0)
  deposit?: number | null;

  @IsOptional()
  @IsIn(renewalDecisionValues)
  renewalDecision?: (typeof renewalDecisionValues)[number];

  @IsOptional()
  @IsDateString()
  workPermitVisaDate?: string | null;

  @IsOptional()
  @IsDateString()
  reportDate?: string | null;
}
