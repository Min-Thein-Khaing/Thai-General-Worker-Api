import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../db/schema/index.js';
import { year } from '../../../db/schema/year.js';
import { YearCreateDto } from '../dto/year-create.dto.js';
import { YearUpdateDto } from '../dto/year-update.dto.js';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import {
  createPaginatedResponse,
  getPagination,
} from '../../../common/utils/pagination.js';

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
    const data = await this.findOne(created.id);
    return { message: 'Year created successfully', data };
  }

  async findAll(query: PaginationQueryDto = {}) {
    const { perPage, offset } = getPagination(query);
    const searchFilter = query.search
      ? or(
          ilike(sql<string>`${year.startYear}::text`, `%${query.search}%`),
          ilike(sql<string>`${year.endYear}::text`, `%${query.search}%`),
        )
      : undefined;
    const [{ totalCount }] = await this.db
      .select({ totalCount: count() })
      .from(year)
      .where(searchFilter);
    const allowedSortColumns = {
      startYear: year.startYear,
      endYear: year.endYear,
      createdAt: year.createdAt,
      id: year.id,
    } as const;
    const sortColumn =
      query.sort_by && query.sort_by in allowedSortColumns
        ? allowedSortColumns[query.sort_by as keyof typeof allowedSortColumns]
        : year.createdAt;
    const sortOrder =
      query.sort_order === 'asc' ? asc(sortColumn) : desc(sortColumn);
    const years = await this.db.query.year.findMany({
      where: searchFilter,
      with: {
        user: true,
      },
      limit: perPage,
      offset: offset,
      orderBy: sortOrder,
    });

    return createPaginatedResponse(
      years,
      Number(totalCount),
      query,
      '/api/year',
    );
  }

  async findOne(id: string) {
    const found = await this.db.query.year.findFirst({
      where: eq(year.id, id),
      with: {
        user: true,
      },
    });
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
    const data = await this.findOne(id);
    return { message: 'Year updated successfully', data };
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
