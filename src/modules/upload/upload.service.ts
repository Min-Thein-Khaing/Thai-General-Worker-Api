import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import type {} from 'multer';

@Injectable()
export class UploadService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>('R2_BUCKET_NAME');

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: this.config.getOrThrow<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(file: Express.Multer.File, userId: string) {
    const key = `documents/${userId}/${randomUUID()}${extname(file.originalname).toLowerCase()}`;

    await this.putObject(file, key);

    return {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      objectKey: key,
    };
  }

  async uploadUserImage(file: Express.Multer.File, userId: string) {
    return this.uploadImage(file, 'users', userId);
  }

  async uploadWorkerImage(file: Express.Multer.File, workerId: string) {
    return this.uploadImage(file, 'workers', workerId);
  }

  private async uploadImage(
    file: Express.Multer.File,
    folder: 'users' | 'workers',
    id: string,
  ) {
    const extensionByMimeType: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const extension = extensionByMimeType[file.mimetype];

    if (!extension) {
      throw new InternalServerErrorException('Unsupported image type');
    }

    const key = `${folder}/${id}/${randomUUID()}${extension}`;
    await this.putObject(file, key);

    const publicUrl = this.config
      .getOrThrow<string>('R2_PUBLIC_URL')
      .replace(/\/+$/, '');

    return {
      objectKey: key,
      url: `${publicUrl}/${key}`,
    };
  }

  private async putObject(file: Express.Multer.File, key: string) {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException('File upload failed', {
        cause: error,
      });
    }
  }

  async deleteFile(objectKey: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );
  }

  async deleteUserImage(imageUrl: string) {
    await this.deleteImage(imageUrl, 'users');
  }

  async deleteWorkerImage(imageUrl: string) {
    await this.deleteImage(imageUrl, 'workers');
  }

  private async deleteImage(imageUrl: string, folder: 'users' | 'workers') {
    const publicUrl = this.config
      .getOrThrow<string>('R2_PUBLIC_URL')
      .replace(/\/+$/, '');
    const publicUrlPrefix = `${publicUrl}/`;

    const objectKey = imageUrl.startsWith(publicUrlPrefix)
      ? imageUrl.slice(publicUrlPrefix.length)
      : undefined;
    if (objectKey?.startsWith(`${folder}/`)) {
      await this.deleteFile(objectKey);
    }
  }
}
