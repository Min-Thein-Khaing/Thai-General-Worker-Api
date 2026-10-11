import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../db/schema/index.js';
import { company } from '../../../db/schema/company.js';
import { CompanyCreateDto } from '../dto/company-create.dto.js';
import { CompanyUpdateDto } from '../dto/company-update.dto.js';

@Injectable()
export class CompanyService {
  constructor(
    @Inject('DB') private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(dto: CompanyCreateDto) {
    const [created] = await this.db
      .insert(company)
      .values({ id: randomUUID(), ...dto })
      .returning();
    return { message: 'Company created successfully', data: created };
  }

  async findAll() {
    return this.db.select().from(company).where(eq(company.isArchived, false));
  }

  async findOne(id: string) {
    const [found] = await this.db
      .select()
      .from(company)
      .where(and(eq(company.id, id), eq(company.isArchived, false)))
      .limit(1);
    if (!found) throw new NotFoundException(`Company ${id} not found`);
    return found;
  }

  async update(id: string, dto: CompanyUpdateDto) {
    const [updated] = await this.db
      .update(company)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(company.id, id), eq(company.isArchived, false)))
      .returning();
    if (!updated) throw new NotFoundException(`Company ${id} not found`);
    return { message: 'Company updated successfully', data: updated };
  }

  async remove(id: string) {
    const [archived] = await this.db
      .update(company)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(company.id, id), eq(company.isArchived, false)))
      .returning({ id: company.id });
    if (!archived) throw new NotFoundException(`Company ${id} not found`);
    return { id: archived.id, isArchived: true };
  }
}
