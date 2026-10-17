import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../db/schema/index.js';
import { company } from '../../../db/schema/company.js';
import { CompanyCreateDto } from '../dto/company-create.dto.js';
import { CompanyUpdateDto } from '../dto/company-update.dto.js';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import {
  createPaginatedResponse,
  getPagination,
} from '../../../common/utils/pagination.js';

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
    const data = await this.findOne(created.id);
    return { message: 'Company created successfully', data };
  }

  async findAll(query: PaginationQueryDto = {}) {
    const { perPage, offset } = getPagination(query);
    const searchFilter = query.search
      ? or(
          ilike(company.companyName, `%${query.search}%`),
          ilike(company.address, `%${query.search}%`),
          ilike(company.phone, `%${query.search}%`),
          ilike(company.contactEmail, `%${query.search}%`),
        )
      : undefined;
    const whereClause = searchFilter
      ? and(eq(company.isArchived, false), searchFilter)
      : eq(company.isArchived, false);
    const [{ totalCount }] = await this.db
      .select({ totalCount: count() })
      .from(company)
      .where(whereClause);

    const allowedSortColumns = {
      companyName: company.companyName,
      createdAt: company.createdAt,
      id: company.id,
    } as const;
    const sortColumn =
      query.sort_by && query.sort_by in allowedSortColumns
        ? allowedSortColumns[query.sort_by as keyof typeof allowedSortColumns]
        : company.createdAt;
    const sortOrder =
      query.sort_order === 'asc' ? asc(sortColumn) : desc(sortColumn);
    const companies = await this.db.query.company.findMany({
      where: whereClause,
      with: {
        user: true,
      },
      limit: perPage,
      offset: offset,
      orderBy: sortOrder,
    });

    return createPaginatedResponse(
      companies,
      Number(totalCount),
      query,
      '/api/company',
    );
  }

  async findOne(id: string) {
    const found = await this.db.query.company.findFirst({
      where: and(eq(company.id, id), eq(company.isArchived, false)),
      with: {
        user: true,
      },
    });
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
    const data = await this.findOne(id);
    return { message: 'Company updated successfully', data };
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
