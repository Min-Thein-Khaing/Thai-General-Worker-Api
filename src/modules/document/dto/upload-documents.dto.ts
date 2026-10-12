import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsIn, IsUUID } from 'class-validator';
import {
  DOCUMENT_TYPE_VALUES,
  type DocumentType,
} from '../../../db/schema/documentation.js';

export class UploadDocumentsDto {
  @IsUUID()
  workerId: string;

  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(DOCUMENT_TYPE_VALUES, { each: true })
  documentTypes: DocumentType[];
}
