import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../db/schema/index.js';
import { manager } from '../../../db/schema/manager.js';
import { ManagerCreateDto } from '../dto/manager-create.dto.js';
import { ManagerUpdateDto } from '../dto/manager-update.dto.js';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import {
  createPaginatedResponse,
  getPagination,
} from '../../../common/utils/pagination.js';

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

  async findAll(query: PaginationQueryDto = {}) {
    const { perPage, offset } = getPagination(query);
    const searchFilter = query.search
      ? or(
          ilike(schema.user.fullName, `%${query.search}%`),
          ilike(schema.user.email, `%${query.search}%`),
          ilike(manager.phone, `%${query.search}%`),
          ilike(manager.gender, `%${query.search}%`),
          ilike(schema.company.companyName, `%${query.search}%`),
        )
      : undefined;
    const [{ totalCount }] = await this.db
      .select({ totalCount: count() })
      .from(manager)
      .leftJoin(schema.user, eq(manager.userId, schema.user.id))
      .leftJoin(schema.company, eq(manager.companyId, schema.company.id))
      .where(searchFilter);
    const allowedSortColumns = {
      fullName: schema.user.fullName,
      email: schema.user.email,
      phone: manager.phone,
      gender: manager.gender,
      createdAt: manager.createdAt,
      id: manager.id,
    } as const;
    const sortColumn =
      query.sort_by && query.sort_by in allowedSortColumns
        ? allowedSortColumns[query.sort_by as keyof typeof allowedSortColumns]
        : manager.createdAt;
    const sortOrder =
      query.sort_order === 'asc' ? asc(sortColumn) : desc(sortColumn);
    const managers = await this.db
      .select()
      .from(manager)
      .leftJoin(schema.user, eq(manager.userId, schema.user.id))
      .leftJoin(schema.company, eq(manager.companyId, schema.company.id))
      .where(searchFilter)
      .limit(perPage)
      .offset(offset)
      .orderBy(sortOrder);

    return createPaginatedResponse(
      managers.map(({ manager: managerRecord }) => managerRecord),
      Number(totalCount),
      query,
      '/api/manager',
    );
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
