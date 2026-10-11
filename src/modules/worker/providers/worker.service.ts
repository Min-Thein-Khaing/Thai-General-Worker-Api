import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../db/schema/index.js';
import { worker } from '../../../db/schema/worker.js';
import { WorkerCreateDto } from '../dto/worker-create.dto.js';
import { WorkerUpdateDto } from '../dto/worker-update.dto.js';

@Injectable()
export class WorkerService {
  constructor(
    @Inject('DB') private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(dto: WorkerCreateDto) {
    const [created] = await this.db
      .insert(worker)
      .values({ id: randomUUID(), ...dto })
      .returning();
    return { message: 'Worker created successfully', data: created };
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

  async update(id: string, dto: WorkerUpdateDto) {
    const [updated] = await this.db
      .update(worker)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(worker.id, id))
      .returning();
    if (!updated) throw new NotFoundException(`Worker ${id} not found`);
    return { message: 'Worker updated successfully', data: updated };
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(worker)
      .where(eq(worker.id, id))
      .returning({ id: worker.id });
    if (!deleted) throw new NotFoundException(`Worker ${id} not found`);
    return { id: deleted.id, deleted: true };
  }
}
