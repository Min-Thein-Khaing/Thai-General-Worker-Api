import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../db/schema/index.js';
import { manager } from '../../../db/schema/manager.js';
import { ManagerCreateDto } from '../dto/manager-create.dto.js';
import { ManagerUpdateDto } from '../dto/manager-update.dto.js';

@Injectable()
export class ManagerService {
  constructor(
    @Inject('DB') private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(dto: ManagerCreateDto) {
    const [created] = await this.db
      .insert(manager)
      .values({ id: randomUUID(), ...dto })
      .returning();
    return { message: 'Manager created successfully', data: created };
  }

  async findAll() {
    return this.db.select().from(manager);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(manager)
      .where(eq(manager.id, id))
      .limit(1);
    if (!found) throw new NotFoundException(`Manager ${id} not found`);
    return found;
  }

  async update(id: string, dto: ManagerUpdateDto) {
    const [updated] = await this.db
      .update(manager)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(manager.id, id))
      .returning();
    if (!updated) throw new NotFoundException(`Manager ${id} not found`);
    return { message: 'Manager updated successfully', data: updated };
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(manager)
      .where(eq(manager.id, id))
      .returning({ id: manager.id });
    if (!deleted) throw new NotFoundException(`Manager ${id} not found`);
    return { id: deleted.id, deleted: true };
  }
}
