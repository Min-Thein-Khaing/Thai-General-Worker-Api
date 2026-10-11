import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class YearUpdateDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsDateString()
  startYear?: string;

  @IsOptional()
  @IsDateString()
  endYear?: string;
}
