import {
  HeaderValue,
  IMetadata,
  PaginationMeta,
  QueuedCookie,
  ResponseBuilderOptions,
} from "../interfaces/IResponse.interface";
import { StatusCodes } from "../constants/status-codes.constant";
import { MetadataFactory, MetadataOptions } from "./metadata.factory";
import { ResponseAs } from "./as.factory";
import {
  BaRFinalResult,
  IBaRDispatcher,
} from "../interfaces/IDispatcher.interface";
import { BaRContext } from "../types/bar-context.types";
import { BaRHookEvent } from "../interfaces";

export class ResponseBuilder<T = unknown, M extends IMetadata = IMetadata> {
  private _statusCode: number = StatusCodes.SUCCESSFUL.OK;
  private _successOverride: boolean | undefined;
  private _message: string | undefined;
  private _data: T | null = null;
  private _metadata: Partial<M> = {};
  private _headers: Record<string, HeaderValue> = {};
  private _cookies: QueuedCookie[] = [];

  constructor(
    private readonly dispatcher?: IBaRDispatcher,
    private readonly options?: ResponseBuilderOptions,
    private readonly context?: BaRContext,
  ) {}

  /**
   * Sets the HTTP status code. Resets any previous {@link forceSuccess} override.
   * @param code - HTTP status code (e.g. `200`, `404`).
   */
  public status(code: number): this {
    this._statusCode = code;
    this._successOverride = undefined;
    return this;
  }

  /**
   * Overrides the inferred `success` flag regardless of status code.
   * @param value - Desired success state.
   */
  public forceSuccess(value: boolean): this {
    this._successOverride = value;
    return this;
  }

  public message(msg: string): this {
    this._message = msg;
    return this;
  }

  public data(data: T | null): this {
    this._data = data;
    return this;
  }

  /**
   * Merges partial metadata. Multiple calls are additive — later keys win.
   * @param meta - Partial metadata to merge.
   */
  public setMeta(meta: Partial<M>): this {
    this._metadata = { ...this._metadata, ...meta };
    return this;
  }

  /**
   * Like {@link setMeta} but auto-populates `server_time`, `request_id`, etc.
   * @param options - Forwarded to `MetadataFactory.create`.
   */
  public withMetadata(options?: MetadataOptions): this {
    const generated = MetadataFactory.create({
      status_code: this._statusCode,
      ...options,
    });

    this._metadata = {
      ...this._metadata,
      ...(generated as unknown as Partial<M>),
    };
    return this;
  }

  /**
   * @param total - Total record count.
   * @param page  - Current page (1-based).
   * @param limit - Page size (must be > 0).
   */
  public paginate(total: number, page: number, limit: number): this {
    if (limit <= 0) {
      throw new Error("BaR.paginate: limit must be greater than 0");
    }

    const pagination: PaginationMeta = {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      has_next: page * limit < total,
    };

    return this.setMeta({ pagination } as unknown as Partial<M>);
  }

  public setHeaders(key: string, value: HeaderValue): this;
  public setHeaders(headers: Record<string, HeaderValue>): this;
  public setHeaders(
    keyOrHeaders: string | Record<string, HeaderValue>,
    value?: HeaderValue,
  ): this {
    if (typeof keyOrHeaders === "string") {
      if (value !== undefined) {
        this._headers[keyOrHeaders] = value;
      }
    } else {
      this._headers = { ...this._headers, ...keyOrHeaders };
    }

    return this;
  }

  /** Alias for {@link setHeaders} (single header). */
  public header(key: string, value: HeaderValue): this {
    return this.setHeaders(key, value);
  }

  public setCookies(name: string, value: string, options?: Record<string, unknown>): this;
  public setCookies(cookies: Record<string, string>, options?: Record<string, unknown>): this;
  public setCookies(
    nameOrCookies: string | Record<string, string>,
    valueOrOptions?: string | Record<string, unknown>,
    options?: Record<string, unknown>,
  ): this {
    if (typeof nameOrCookies === "string") {
      if (typeof valueOrOptions === "string") {
        this._cookies.push({ name: nameOrCookies, value: valueOrOptions, options });
      }
    } else {
      const sharedOptions = typeof valueOrOptions === "object" ? valueOrOptions : undefined;
      for (const [name, value] of Object.entries(nameOrCookies)) {
        this._cookies.push({ name, value, options: sharedOptions });
      }
    }

    return this;
  }

  private resolvePublicErrorMessage(error: unknown): string {
    const isProd = this.options?.environment === "production";

    if (isProd) {
      return "Internal Server Error";
    }

    if (error instanceof Error) {
      if (this.options?.includeStack && error.stack) {
        return error.stack;
      }
      return error.message;
    }

    return "Internal Server Error";
  }

  /**
   * Resolves a promise into {@link data}. On rejection, falls back to `500`.
   * In `production` environment, error details are not exposed to clients.
   * @param promise - Promise whose resolved type matches `T`.
   */
  public async wrap(promise: Promise<T>): Promise<this> {
    try {
      this.data(await promise);
    } catch (error: unknown) {
      const msg = this.resolvePublicErrorMessage(error);
      this.status(StatusCodes.SERVER_ERROR.INTERNAL_SERVER_ERROR)
        .data(null)
        .message(msg)
        .forceSuccess(false);

      this.options?.hooks?.emit("error", {
        error,
        message: msg,
        statusCode: StatusCodes.SERVER_ERROR.INTERNAL_SERVER_ERROR,
      });
    }

    return this;
  }

  /**
   * Transforms the current data payload. Skipped when `data` is `null`.
   * @param fn - Pure transform function `(data: T) => U`.
   * @typeParam U - Output type after transformation.
   */
  public transform<U>(fn: (data: T) => U): ResponseBuilder<U, M> {
    const next = this as unknown as ResponseBuilder<U, M>;

    if (this._data !== null) {
      (next as unknown as ResponseBuilder<U, M>)["_data"] = fn(this._data);
    }

    return next;
  }

  /**
   * Conditionally applies a builder callback. Return value is ignored.
   * @param condition - When `true`, `fn` is invoked.
   * @param fn        - Callback that mutates the builder.
   */
  public when(condition: boolean, fn: (builder: this) => void): this {
    if (condition) fn(this);
    return this;
  }

  public get as(): ResponseAs<T, M> {
    return new ResponseAs(this);
  }

  private emitHook(event: BaRHookEvent, result: BaRFinalResult): void {
    const hooks = this.options?.hooks;
    if (!hooks?.hasListeners(event)) return;
    hooks.emit(event, structuredClone(result));
  }

  /**
   * Assembles and optionally dispatches the final response.
   *
   * Hook order: `before_build` → assemble → `after_build`
   * → `before_dispatch` → dispatch → `after_dispatch`
   */
  public build(): BaRFinalResult {
    this.options?.hooks?.emit("before_build", { statusCode: this._statusCode });

    const isSuccess =
      this._successOverride ?? (this._statusCode >= 200 && this._statusCode < 400);

    const finalMetadata = MetadataFactory.create(
      { status_code: this._statusCode, ...this._metadata },
      { request_id: this.context?.request_id },
    );

    const normalizedData = this._data === undefined ? null : this._data;

    const result: BaRFinalResult = {
      body: {
        success: isSuccess,
        message: this._message ?? (isSuccess ? "Operation successful" : "Operation failed"),
        data: normalizedData,
        timestamp: new Date().toISOString(),
        metadata: finalMetadata,
      },
      statusCode: this._statusCode,
      headers: this._headers,
      cookies: this._cookies,
    };

    this.emitHook("after_build", result);
    this.options?.logger?.debug?.("BaR built response", result);

    if (this.dispatcher) {
      this.emitHook("before_dispatch", result);
      const dispatched = this.dispatcher.dispatch(result);
      this.emitHook("after_dispatch", result);
      this.options?.logger?.info?.("BaR dispatched response", {
        statusCode: this._statusCode,
        success: isSuccess,
      });

      return dispatched;
    }

    return result;
  }
}
