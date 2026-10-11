import { randomBytes, scrypt } from 'node:crypto';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, asc, count, desc, eq, like, or, SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../../db/schema/index.js';
import { user } from '../../../db/schema/user.js';
import { UserCreateDto } from '../dto/user-create.dto.js';
import { UserUpdateDto } from '../dto/user-update.dto.js';
import { HashProvider } from '../../auth/providers/hash.provider.js';
import { FindAllQuery } from '../interface/user-query.interface.js';
import { PaginatedResponse } from '../../../common/interface/responseTypePagination.js';
import { ConfigService } from '@nestjs/config';
import { UploadService } from '../../upload/upload.service.js';
import type {} from 'multer';

const publicUserFields = {
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  imageUrl: user.imageUrl,
  isArchived: user.isArchived,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

@Injectable()
export class UserService {
  constructor(
    @Inject('DB')
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly hashProvider: HashProvider,
    private readonly configService: ConfigService,
    private readonly uploadService: UploadService,
  ) {}

  async create(userCreateDto: UserCreateDto, image?: Express.Multer.File) {
    const { password, imageUrl, ...fields } = userCreateDto;
    const hashedPassword = await this.hashProvider.hash(password);
    const id = randomUUID();
    const uploadedImage = image
      ? await this.uploadService.uploadUserImage(image, id)
      : undefined;

    try {
      const [createdUser] = await this.db
        .insert(schema.user)
        .values({
          id,
          ...fields,
          password: hashedPassword,
          imageUrl: uploadedImage?.url ?? imageUrl,
        })
        .returning(publicUserFields);

      return {
        message: 'Create Successfully User',
        data: createdUser,
      };
    } catch (error) {
      if (uploadedImage) {
        try {
          await this.uploadService.deleteFile(uploadedImage.objectKey);
        } catch (cleanupError) {
          throw new AggregateError(
            [error, cleanupError],
            'User creation failed and the uploaded image could not be removed',
          );
        }
      }
      throw error;
    }
  }

  async findAll(
    query: FindAllQuery = {},
  ): Promise<PaginatedResponse<typeof schema.user.$inferInsert>> {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 10;
    const offset = (page - 1) * perPage;
    const limit = perPage;

    const filters: SQL[] = [eq(user.isArchived, false)];

    if (query.search) {
      filters.push(
        or(
          like(schema.user.fullName, `%${query.search}%`),
          like(schema.user.email, `%${query.search}%`),
        )!,
      );
    }
    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const allowedSortColumns = {
      name: schema.user.fullName,
      email: schema.user.email,
      role: schema.user.role,
      createdAt: schema.user.createdAt,
      id: schema.user.id,
    } as const;

    const sortColumn =
      query.sort_by && query.sort_by in allowedSortColumns
        ? allowedSortColumns[query.sort_by as keyof typeof allowedSortColumns]
        : schema.user.createdAt;

    const sortOrder =
      query.sort_order === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // 4. Query Total Count for Meta
    const [{ totalCount }] = await this.db
      .select({ totalCount: count() })
      .from(schema.user)
      .where(whereClause);

    const total = Number(totalCount); //total count
    const lastPage = Math.ceil(total / perPage) || 1; //last page

    const users = await this.db
      .select()
      .from(schema.user)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(sortOrder);

    const from = total > 0 ? offset + 1 : null;
    const to = total > 0 ? Math.min(offset + users.length, total) : null;
    const baseUrl = `${this.configService.get('ALLOWED_ORIGINS')}/api/user`;

    return {
      data: users,
      links: {
        first: `${baseUrl}?page=1`,
        last: `${baseUrl}?page=${lastPage}`,
        prev: page > 1 ? `${baseUrl}?page=${page - 1}` : null,
        next: page < lastPage ? `${baseUrl}?page=${page + 1}` : null,
      },
      meta: {
        current_page: page,
        from,
        last_page: lastPage,
        path: baseUrl,
        per_page: perPage,
        to,
        total,
      },
    };
  }
  async findMine(ownId: string) {
    const [foundUser] = await this.db
      .select(publicUserFields)
      .from(user)
      .where(and(eq(user.id, ownId), eq(user.isArchived, false)))
      .limit(1);

    if (!foundUser) {
      throw new NotFoundException(`User ${ownId} not found`);
    }

    return {
      message: 'Get Successfully User',
      data: foundUser,
    };
  }

  async findOne(id: string) {
    const [foundUser] = await this.db
      .select(publicUserFields)
      .from(user)
      .where(and(eq(user.id, id), eq(user.isArchived, false)))
      .limit(1);

    if (!foundUser) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return {
      message: 'Get Successfully User',
      data: foundUser,
    };
  }

  async update(
    id: string,
    dto: UserUpdateDto,
    image?: Express.Multer.File,
  ) {
    const { password, ...fields } = dto;
    const [existingUser] = await this.db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.id, id), eq(user.isArchived, false)))
      .limit(1);

    if (!existingUser) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const uploadedImage = image
      ? await this.uploadService.uploadUserImage(image, id)
      : undefined;

    try {
      const [updatedUser] = await this.db
        .update(user)
        .set({
          ...fields,
          ...(uploadedImage ? { imageUrl: uploadedImage.url } : {}),
        })
        .where(and(eq(user.id, id), eq(user.isArchived, false)))
        .returning(publicUserFields);

      if (!updatedUser) {
        throw new NotFoundException(`User ${id} not found`);
      }

      return {
        message: 'User updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      if (uploadedImage && !(error instanceof NotFoundException)) {
        try {
          await this.uploadService.deleteFile(uploadedImage.objectKey);
        } catch (cleanupError) {
          throw new AggregateError(
            [error, cleanupError],
            'User update failed and the uploaded image could not be removed',
          );
        }
      }
      throw error;
    }
  }

  async updatePassword(id: string, oldPassword: string, newPassword: string) {
    const [userRecord] = await this.db
      .select()
      .from(schema.user)
      .where(and(eq(schema.user.id, id), eq(schema.user.isArchived, false)))
      .limit(1);

    if (!userRecord) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const isPasswordValid = await this.hashProvider.compare(
      oldPassword,
      userRecord.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const hashedPassword = await this.hashProvider.hash(newPassword);
    await this.db
      .update(user)
      .set({ password: hashedPassword })
      .where(and(eq(user.id, id), eq(user.isArchived, false)));
    return { message: 'Change Password Successfully' };
  }

  async remove(id: string) {
    const [archivedUser] = await this.db
      .update(user)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(user.id, id), eq(user.isArchived, false)))
      .returning({ id: user.id, imageUrl: user.imageUrl });

    if (!archivedUser) {
      throw new NotFoundException(`User ${id} not found`);
    }

    if (archivedUser.imageUrl) {
      await this.uploadService.deleteUserImage(archivedUser.imageUrl);
    }

    return { id: archivedUser.id, isArchived: true };
  }
}
