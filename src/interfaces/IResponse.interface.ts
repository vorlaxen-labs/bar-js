import { BaRHooks } from "../core";

export type IMetadata<TExtra = unknown> = {
  request_id: string;
  server_time: string;
  status_code: number;
} & (TExtra extends object ? TExtra : {});

type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ErrorDetail = {
  field?: string;
  message: string;
  code?: string;
};

export type ResponseError = {
  code: string;
  message: string;
  details?: ErrorDetail[];
};

type ErrorResponse = {
  success: false;
  data: null;
  error: ResponseError;
};

export type IResponse<T = unknown, M = unknown> =
  | (SuccessResponse<T> & {
      timestamp: string;
      metadata: IMetadata<M>;
    })
  | (ErrorResponse & {
      timestamp: string;
      metadata: IMetadata<M>;
    });

export type HeaderValue = string | number | readonly string[];
export type Environment = 'development' | 'production' | 'test';

export interface Logger {
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
  debug?(message: string, meta?: unknown): void;
}

export interface QueuedCookie {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

export interface OffsetPaginationMeta {
  strategy: "offset";
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface CursorPaginationMeta {
  strategy: "cursor";
  limit: number;
  next_cursor: string | null;
  prev_cursor: string | null;
  has_next: boolean;
  has_prev: boolean;
}

export type PaginationMeta = OffsetPaginationMeta | CursorPaginationMeta;

export type OffsetPaginationOptions = {
  strategy: "offset";
  total: number;
  page: number;
  limit: number;
};

export type CursorPaginationOptions = {
  strategy: "cursor";
  limit: number;
  next_cursor?: string | null;
  prev_cursor?: string | null;
  has_next?: boolean;
  has_prev?: boolean;
};

export type PaginateOptions = OffsetPaginationOptions | CursorPaginationOptions;

export type BaRHookEvent =
  | 'before_build'
  | 'after_build'
  | 'before_dispatch'
  | 'after_dispatch'
  | 'error';

export interface ResponseBuilderOptions {
  defaultHeaders?: Record<string, string>;
  environment?: 'development' | 'production' | 'test';
  includeStack?: boolean;
  logger?: Logger;
  hooks?: BaRHooks;
}