import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/role.decorator.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { DocumentService } from './providers/document.service.js';
import { UploadDocumentsDto } from './dto/upload-documents.dto.js';
import type { Request } from 'express';
import type { UserData } from '../../common/interface/userData.interface.js';

// PDF နဲ့ image file type တွေသာ ခွင့်ပြု
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB per file

@Controller('documents')
@UseGuards(JwtAuthGuard, RoleGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /**
   * POST /documents/upload
   * Admin က worker ရဲ့ document file တွေ upload လုပ်မယ် (max 10 files)
   * - PDF, JPEG, PNG, WEBP သာ ခွင့်ပြု
   * - File size max 20MB per file
   * - multipart/form-data: files[] + workerId
   */
  @Post('upload')
  @Roles('ADMIN')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `File type "${file.mimetype}" is not allowed. Use PDF, JPEG, PNG, or WEBP.`,
            ),
            false,
          );
        }
      },
    }),
  )
  uploadDocuments(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadDocumentsDto,
    @Req() req: Request,
  ) {
    const user = req.user as UserData;
    return this.documentService.uploadDocuments(files, dto.workerId, user.id);
  }

  /**
   * GET /documents/worker/:workerId
   * Worker ရဲ့ document list ကြည့်မယ်
   * ADMIN + MANAGER + GENERAL_WORKER ကြည့်နိုင်
   */
  @Get('worker/:workerId')
  @Roles('ADMIN', 'MANAGER', 'GENERAL_WORKER')
  getWorkerDocuments(@Param('workerId', new ParseUUIDPipe()) workerId: string) {
    return this.documentService.getWorkerDocuments(workerId);
  }

  /**
   * GET /documents/:id/download
   * Document တစ်ခု download လုပ်ဖို့ presigned URL ထုတ်
   * URL သက်တမ်း: 15 minutes
   */
  @Get(':id/download')
  @Roles('ADMIN', 'MANAGER', 'GENERAL_WORKER')
  getDownloadUrl(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.documentService.getDownloadUrl(id);
  }

  /**
   * DELETE /documents/:id
   * Document တစ်ခု ဖျက်မယ် (R2 + DB)
   */
  @Delete(':id')
  @Roles('ADMIN')
  deleteDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as UserData;
    return this.documentService.deleteDocument(id, user.id);
  }
}
