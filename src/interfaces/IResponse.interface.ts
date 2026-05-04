import { BaRHooks } from "../core";

export type IMetadata<TExtra = unknown> = {
  request_id: string;
  server_time: string;
  status_code: number;
} & (TExtra extends object ? TExtra : {});

type SuccessResponse<T> = {
  success: true;
  data: T;
};

type ErrorResponse = {
  success: false;
  data: null;
};

export type IResponse<T = unknown, M = unknown> =
  (SuccessResponse<T> | ErrorResponse) & {
    timestamp: string;
    message?: string;
    metadata: IMetadata<M>;
  };

export type HeaderValue = string | number | readonly string[];
export type Environment = 'development' | 'production' | 'test';

export interface Logger {
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
  debug?(message: string, meta?: unknown): void;
}

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