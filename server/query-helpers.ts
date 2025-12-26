/**
 * Query Optimization Helpers
 * Utilities to reduce database egress by fetching only required data
 */

import { SQL, sql } from 'drizzle-orm';
import { PgSelect } from 'drizzle-orm/pg-core';

/**
 * Pagination helper - reduces egress by limiting result sets
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Apply pagination to any Drizzle query
 */
export function withPagination<T extends PgSelect>(
  query: T,
  options: PaginationOptions = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20)); // Max 100 items per page
  const offset = (page - 1) * limit;

  return query.limit(limit).offset(offset);
}

/**
 * Create paginated response with metadata
 */
export async function createPaginatedResponse<T>(
  data: T[],
  totalCount: number,
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Select only specific columns from a table
 * Example: selectColumns(users, ['id', 'username', 'email'])
 */
export function selectColumns<T extends Record<string, any>>(
  table: T,
  columns: (keyof T)[]
): Record<string, any> {
  const selected: Record<string, any> = {};
  for (const col of columns) {
    selected[col as string] = table[col];
  }
  return selected;
}

/**
 * Common select patterns to reduce data transfer
 */
export const SelectPatterns = {
  /**
   * User minimal info (for listings, dropdowns)
   */
  userBasic: ['id', 'username', 'email', 'fullName', 'profileImage'] as const,
  
  /**
   * Course listing info (not full content)
   */
  courseListing: ['id', 'title', 'description', 'thumbnailUrl', 'price', 'instructorId', 'publishedAt'] as const,
  
  /**
   * Product listing info
   */
  productListing: ['id', 'name', 'description', 'price', 'imageUrl', 'sellerId', 'status'] as const,
  
  /**
   * Portfolio sample info
   */
  portfolioSample: ['id', 'title', 'description', 'imageUrl', 'category', 'userId'] as const,
};

/**
 * Batch operations helper - reduces multiple queries to one
 */
export async function batchFetch<T, K>(
  ids: K[],
  fetchFn: (ids: K[]) => Promise<T[]>,
  keyExtractor: (item: T) => K
): Promise<Map<K, T>> {
  if (ids.length === 0) {
    return new Map();
  }

  const results = await fetchFn(ids);
  const map = new Map<K, T>();
  
  for (const result of results) {
    map.set(keyExtractor(result), result);
  }
  
  return map;
}

/**
 * Query performance logger
 */
export function logQueryPerformance(queryName: string, startTime: number, rowCount: number) {
  const duration = Date.now() - startTime;
  const emoji = duration > 1000 ? '🐌' : duration > 500 ? '⚠️' : '⚡';
  console.log(`${emoji} Query "${queryName}": ${duration}ms, ${rowCount} rows`);
}
