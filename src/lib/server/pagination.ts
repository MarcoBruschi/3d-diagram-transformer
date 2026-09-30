/**
 * Standardized Pagination Helper for Diagram3D API Endpoints.
 * Supports both cursor-based (for infinite scrolling / real-time feeds)
 * and page-based (for administrative tables).
 */

export interface PaginationParams {
  page: number;
  limit: number;
  cursor?: string;
  skip?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total?: number;
    totalPages?: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

/**
 * Extracts and sanitizes pagination parameters from an incoming request URL.
 */
export function parsePaginationParams(
  urlOrReq: URL | Request | string,
  options: { defaultLimit?: number; maxLimit?: number } = {}
): PaginationParams {
  const { defaultLimit = 12, maxLimit = 50 } = options;

  let searchParams: URLSearchParams;
  if (typeof urlOrReq === 'string') {
    searchParams = new URL(urlOrReq, 'http://localhost').searchParams;
  } else if (urlOrReq instanceof Request) {
    searchParams = new URL(urlOrReq.url).searchParams;
  } else {
    searchParams = urlOrReq.searchParams;
  }

  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawLimit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(1, rawLimit), maxLimit)
    : defaultLimit;

  const cursor = searchParams.get('cursor')?.trim() || undefined;
  const skip = cursor ? undefined : (page - 1) * limit;

  return { page, limit, cursor, skip };
}

/**
 * Encapsulates an array of results into a unified pagination envelope.
 */
export function buildPaginatedResponse<T>(
  items: T[],
  limit: number,
  options: {
    page?: number;
    total?: number;
    getCursor?: (item: T) => string;
  } = {}
): PaginatedResult<T> {
  const { page = 1, total, getCursor } = options;

  let nextCursor: string | null = null;
  let hasMore = false;

  if (getCursor && items.length > 0) {
    // If the caller fetched limit + 1 items to check hasMore:
    if (items.length > limit) {
      items = items.slice(0, limit);
      hasMore = true;
      nextCursor = getCursor(items[items.length - 1]);
    } else if (typeof total === 'number') {
      hasMore = page * limit < total;
      nextCursor = hasMore && items.length > 0 ? getCursor(items[items.length - 1]) : null;
    }
  } else if (typeof total === 'number') {
    hasMore = page * limit < total;
  }

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: typeof total === 'number' ? Math.ceil(total / limit) : undefined,
      nextCursor,
      hasMore,
    },
  };
}
