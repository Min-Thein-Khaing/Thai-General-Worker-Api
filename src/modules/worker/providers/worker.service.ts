import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../db/schema/index.js';
import { worker } from '../../../db/schema/worker.js';
import { WorkerCreateDto } from '../dto/worker-create.dto.js';
import { WorkerUpdateDto } from '../dto/worker-update.dto.js';
import { UploadService } from '../../upload/upload.service.js';

@Injectable()
export class WorkerService {
  constructor(
    @Inject('DB') private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly uploadService: UploadService,
  ) {}

  async create(dto: WorkerCreateDto, image?: Express.Multer.File) {
    const id = randomUUID();
    const uploadedImage = image
      ? await this.uploadService.uploadWorkerImage(image, id)
      : undefined;

    try {
      const [created] = await this.db
        .insert(worker)
        .values({ id, ...dto, imageUrl: uploadedImage?.url })
        .returning();
      return { message: 'Worker created successfully', data: created };
    } catch (error) {
      if (uploadedImage) {
        try {
          await this.uploadService.deleteFile(uploadedImage.objectKey);
        } catch (cleanupError) {
          throw new AggregateError(
            [error, cleanupError],
            'Worker creation failed and the uploaded image could not be removed',
          );
        }
      }
      throw error;
    }
  }

  async findAll() {
    return this.db.select().from(worker);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(worker)
      .where(eq(worker.id, id))
      .limit(1);
    if (!found) throw new NotFoundException(`Worker ${id} not found`);
    return found;
  }

  async update(id: string, dto: WorkerUpdateDto, image?: Express.Multer.File) {
    const [existingWorker] = await this.db
      .select({ imageUrl: worker.imageUrl })
      .from(worker)
      .where(eq(worker.id, id))
      .limit(1);
    if (!existingWorker) throw new NotFoundException(`Worker ${id} not found`);

    const uploadedImage = image
      ? await this.uploadService.uploadWorkerImage(image, id)
      : undefined;

    let updated: typeof worker.$inferSelect | undefined;
    try {
      [updated] = await this.db
        .update(worker)
        .set({
          ...dto,
          ...(uploadedImage ? { imageUrl: uploadedImage.url } : {}),
          updatedAt: new Date(),
        })
        .where(eq(worker.id, id))
        .returning();
    } catch (error) {
      if (uploadedImage) {
        try {
          await this.uploadService.deleteFile(uploadedImage.objectKey);
        } catch (cleanupError) {
          throw new AggregateError(
            [error, cleanupError],
            'Worker update failed and the uploaded image could not be removed',
          );
        }
      }
      throw error;
    }

    if (!updated) {
      if (uploadedImage) {
        await this.uploadService.deleteFile(uploadedImage.objectKey);
      }
      throw new NotFoundException(`Worker ${id} not found`);
    }

    if (uploadedImage && existingWorker.imageUrl) {
      await this.uploadService.deleteWorkerImage(existingWorker.imageUrl);
    }

    return { message: 'Worker updated successfully', data: updated };
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(worker)
      .where(eq(worker.id, id))
      .returning({ id: worker.id, imageUrl: worker.imageUrl });
    if (!deleted) throw new NotFoundException(`Worker ${id} not found`);
    if (deleted.imageUrl) {
      await this.uploadService.deleteWorkerImage(deleted.imageUrl);
    }
    return { id: deleted.id, deleted: true };
  }
}
