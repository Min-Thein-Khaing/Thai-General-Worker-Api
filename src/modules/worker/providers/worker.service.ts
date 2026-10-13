import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, asc, count, desc, eq, ilike, or, sql, SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../db/schema/index.js';
import { worker } from '../../../db/schema/worker.js';
import { manager } from '../../../db/schema/manager.js';
import type { UserData } from '../../../common/interface/userData.interface.js';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import {
  createPaginatedResponse,
  getPagination,
} from '../../../common/utils/pagination.js';
import { WorkerCreateDto } from '../dto/worker-create.dto.js';
import { WorkerUpdateDto } from '../dto/worker-update.dto.js';
import { UploadService } from '../../upload/upload.service.js';

const BUSINESS_TIME_ZONE = 'Asia/Bangkok';

@Injectable()
export class WorkerService {
  constructor(
    @Inject('DB') private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly uploadService: UploadService,
  ) {}

  async create(dto: WorkerCreateDto, image?: Express.Multer.File) {
    const total = dto.total ?? 0;
    const deposit = dto.deposit ?? null;
    this.validatePayment(total, deposit);

    const id = randomUUID();
    const uploadedImage = image
      ? await this.uploadService.uploadWorkerImage(image, id)
      : undefined;

    try {
      const [created] = await this.db
        .insert(worker)
        .values({
          id,
          ...dto,
          total,
          deposit,
          balance: total - (deposit ?? 0),
          imageUrl: uploadedImage?.url,
        })
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

  async findAll(query: PaginationQueryDto = {}, currentUser: UserData) {
    const { perPage, offset } = getPagination(query);
    const filters: SQL[] = [];
    if (currentUser.role === 'MANAGER') {
      const [managerProfile] = await this.db
        .select({ id: manager.id })
        .from(manager)
        .where(eq(manager.userId, currentUser.id))
        .limit(1);
      if (!managerProfile) {
        throw new NotFoundException(
          `Manager profile for user ${currentUser.id} not found`,
        );
      }
      filters.push(eq(worker.managerId, managerProfile.id));
    }
    if (query.search) {
      filters.push(
        or(
          ilike(schema.user.fullName, `%${query.search}%`),
          ilike(schema.user.email, `%${query.search}%`),
          ilike(worker.passportNumber, `%${query.search}%`),
          ilike(worker.workPermitNumber, `%${query.search}%`),
          ilike(worker.ciNumber, `%${query.search}%`),
          ilike(worker.phone, `%${query.search}%`),
          ilike(worker.typeOfBook, `%${query.search}%`),
        )!,
      );
    }
    const whereClause = filters.length ? and(...filters) : undefined;
    const [{ totalCount }] = await this.db
      .select({ totalCount: count() })
      .from(worker)
      .leftJoin(schema.user, eq(worker.userId, schema.user.id))
      .where(whereClause);
    const allowedSortColumns = {
      fullName: schema.user.fullName,
      total: worker.total,
      deposit: worker.deposit,
      balance: worker.balance,
      reportDate: worker.reportDate,
      createdAt: worker.createdAt,
      id: worker.id,
    } as const;
    const sortColumn =
      query.sort_by && query.sort_by in allowedSortColumns
        ? allowedSortColumns[query.sort_by as keyof typeof allowedSortColumns]
        : worker.createdAt;
    const sortOrder =
      query.sort_order === 'asc' ? asc(sortColumn) : desc(sortColumn);
    const workers = await this.db
      .select({ worker })
      .from(worker)
      .leftJoin(schema.user, eq(worker.userId, schema.user.id))
      .where(whereClause)
      .limit(perPage)
      .offset(offset)
      .orderBy(sortOrder);

    return createPaginatedResponse(
      workers.map(({ worker: workerRecord }) => workerRecord),
      Number(totalCount),
      query,
      '/api/worker',
    );
  }

  async getFinancialSummary(user: UserData) {
    let managerId: string | undefined;
    if (user.role === 'MANAGER') {
      const [managerProfile] = await this.db
        .select({ id: manager.id })
        .from(manager)
        .where(eq(manager.userId, user.id))
        .limit(1);
      if (!managerProfile) {
        throw new NotFoundException(`Manager profile for user ${user.id} not found`);
      }
      managerId = managerProfile.id;
    }

    const [summary] = await this.db
      .select({
        workerCount: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${worker.total}), 0)::double precision`,
        deposit: sql<number>`coalesce(sum(${worker.deposit}), 0)::double precision`,
        balance: sql<number>`coalesce(sum(${worker.total} - coalesce(${worker.deposit}, 0)), 0)::double precision`,
      })
      .from(worker)
      .where(managerId ? eq(worker.managerId, managerId) : undefined);

    return {
      scope: managerId ? 'MANAGER' : 'ALL',
      workerCount: summary.workerCount,
      total: summary.total,
      deposit: summary.deposit,
      balance: summary.balance,
    };
  }

  async findReportNotifications() {
    const todayParts = new Intl.DateTimeFormat('en', {
      timeZone: BUSINESS_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const dateParts = Object.fromEntries(
      todayParts
        .filter(({ type }) => type !== 'literal')
        .map(({ type, value }) => [type, value]),
    );
    const todayString = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
    const reminderDate = new Date(`${todayString}T00:00:00.000Z`);
    reminderDate.setUTCDate(reminderDate.getUTCDate() + 7);
    const reminderDateString = reminderDate.toISOString().slice(0, 10);
    const workersWithUpcomingReports = await this.db
      .select()
      .from(worker)
      .where(eq(worker.reportDate, reminderDateString));

    return workersWithUpcomingReports.map((upcomingWorker) => ({
      worker: upcomingWorker,
      reportDate: upcomingWorker.reportDate,
      daysUntilReport: 7,
    }));
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
      .select({
        imageUrl: worker.imageUrl,
        total: worker.total,
        deposit: worker.deposit,
      })
      .from(worker)
      .where(eq(worker.id, id))
      .limit(1);
    if (!existingWorker) throw new NotFoundException(`Worker ${id} not found`);

    const total = dto.total ?? existingWorker.total;
    const deposit =
      dto.deposit === undefined ? existingWorker.deposit : dto.deposit;
    this.validatePayment(total, deposit);

    const uploadedImage = image
      ? await this.uploadService.uploadWorkerImage(image, id)
      : undefined;

    let updated: typeof worker.$inferSelect | undefined;
    try {
      [updated] = await this.db
        .update(worker)
        .set({
          ...dto,
          total,
          deposit,
          balance: total - (deposit ?? 0),
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

  private validatePayment(total: number, deposit: number | null) {
    if (deposit !== null && deposit > total) {
      throw new BadRequestException('Deposit cannot exceed the total price');
    }
  }
}
