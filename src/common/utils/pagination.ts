import type { PaginationQueryDto } from '../dto/pagination-query.dto.js';
import type { PaginatedResponse } from '../interface/responseTypePagination.js';

export function getPagination(query: PaginationQueryDto = {}) {
  const page = query.page ?? 1;
  const perPage = query.per_page ?? 10;

  return {
    page,
    perPage,
    offset: (page - 1) * perPage,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  query: PaginationQueryDto,
  path: string,
): PaginatedResponse<T> {
  const { page, perPage, offset } = getPagination(query);
  const lastPage = Math.ceil(total / perPage) || 1;

  const createLink = (targetPage: number) => {
    const params = new URLSearchParams({
      page: String(targetPage),
      per_page: String(perPage),
    });
    if (query.search) params.set('search', query.search);
    if (query.sort_by) params.set('sort_by', query.sort_by);
    if (query.sort_order) params.set('sort_order', query.sort_order);
    return `${path}?${params.toString()}`;
  };

  return {
    data,
    links: {
      first: createLink(1),
      last: createLink(lastPage),
      prev: page > 1 ? createLink(page - 1) : null,
      next: page < lastPage ? createLink(page + 1) : null,
    },
    meta: {
      current_page: page,
      from: data.length > 0 ? offset + 1 : null,
      last_page: lastPage,
      path,
      per_page: perPage,
      to: data.length > 0 ? Math.min(offset + data.length, total) : null,
      total,
    },
  };
}
