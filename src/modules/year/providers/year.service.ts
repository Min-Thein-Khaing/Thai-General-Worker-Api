import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../db/schema/index.js';
import { year } from '../../../db/schema/year.js';
import { YearCreateDto } from '../dto/year-create.dto.js';
import { YearUpdateDto } from '../dto/year-update.dto.js';

@Injectable()
export class YearService {
  constructor(
    @Inject('DB') private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(dto: YearCreateDto) {
    const [created] = await this.db
      .insert(year)
      .values({ id: randomUUID(), ...dto })
      .returning();
    return { message: 'Year created successfully', data: created };
  }

  async findAll() {
    return this.db.select().from(year);
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(year)
      .where(eq(year.id, id))
      .limit(1);
    if (!found) throw new NotFoundException(`Year ${id} not found`);
    return found;
  }

  async update(id: string, dto: YearUpdateDto) {
    const [updated] = await this.db
      .update(year)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(year.id, id))
      .returning();
    if (!updated) throw new NotFoundException(`Year ${id} not found`);
    return { message: 'Year updated successfully', data: updated };
  }

  async remove(id: string) {
    const [deleted] = await this.db
      .delete(year)
      .where(eq(year.id, id))
      .returning({ id: year.id });
    if (!deleted) throw new NotFoundException(`Year ${id} not found`);
    return { id: deleted.id, deleted: true };
  }
}
