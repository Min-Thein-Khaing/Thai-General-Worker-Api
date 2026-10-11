import { IsDateString, IsUUID } from 'class-validator';

export class YearCreateDto {
  @IsUUID()
  userId!: string;

  @IsDateString()
  startYear!: string;

  @IsDateString()
  endYear!: string;
}
