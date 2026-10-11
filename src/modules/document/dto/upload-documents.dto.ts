import { IsUUID } from 'class-validator';

export class UploadDocumentsDto {
  @IsUUID()
  workerId: string;
}
