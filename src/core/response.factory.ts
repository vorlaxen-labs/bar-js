import {
  HeaderValue,
  IResponse,
  ResponseBuilderOptions
} from '../interfaces/IResponse.interface';
import { StatusCodes } from '../constants/status-codes.constant';
import { MetadataFactory, MetadataOptions } from './metadata.factory';
import { ResponseAs } from './as.factory';
import { BaRFinalResult, IBaRDispatcher } from '../interfaces/IDispatcher.interface';
import { BaRContext } from '../types/bar-context.types';

/**
 * @class ResponseBuilder
 * @description The primary orchestrator for constructing standardized API responses.
 * Implements a Fluent Interface for method chaining and a Namespace Pattern for presets.
 */
export class ResponseBuilder<
  T = unknown,
  M extends Record<string, any> = Record<string, any>
> {
  private _dispatcher?: IBaRDispatcher;
  private _statusCode: number = StatusCodes.SUCCESSFUL.OK;
  private _headers: Record<string, HeaderValue> = {};
  private _metadata: Partial<M> = {};
  private _payload: Partial<IResponse<T>> = {
    success: true,
    data: null as any,
  };

  /**
   * @param options Optional configuration for the builder instance.
   */
  constructor(
    private dispatcher?: IBaRDispatcher,
    private readonly options?: ResponseBuilderOptions,
    private readonly context?: BaRContext
  ) {
    this._dispatcher = dispatcher; // ✅ bunu ekleyin
  }

  /**
   * Sets the HTTP status code and automatically infers the 'success' boolean.
   * @param code HTTP status code (e.g., 200, 404, 500)
   */
  public status(code: number): this {
    this._statusCode = code;
    // Infers success status based on standard HTTP conventions (2xx and 3xx)
    this._payload.success = code >= 200 && code < 400;
    return this;
  }

  /**
   * Explicitly overrides the success flag of the response.
   */
  public success(value: boolean): this {
    this._payload.success = value;
    return this;
  }

  /**
   * Defines the descriptive message for the response.
   */
  public message(msg: string): this {
    this._payload.message = msg;
    return this;
  }

  /**
   * Attaches the primary data payload to the response.
   */
  public data(data: T): this {
    this._payload.data = data;
    return this;
  }

  /**
   * Merges custom metadata into the current response context.
   */
  public setMeta(meta: M): this {
    this._metadata = { ...this._metadata, ...meta };
    return this;
  }

  /**
   * Appends an HTTP header to the final response.
   */
  public header(key: string, value: HeaderValue): this {
    this._headers[key] = value;
    return this;
  }

  /**
   * Initializes or overrides metadata using the MetadataFactory.
   */
  public withMetadata(options?: MetadataOptions): this {
    const generatedMeta = MetadataFactory.create({
      status_code: this._statusCode,
      ...options,
    });

    this._metadata = { ...this._metadata, ...generatedMeta } as Partial<M>;
    return this;
  }

  /**
   * Accesses the Factory Namespace for semantic presets (ok, created, error, etc.)
   */
  public get as(): ResponseAs<T, M> {
    return new ResponseAs(this);
  }

  /**
   * Aggregates all builder states into a standardized response object.
   * @returns A structured response containing the body, status code, and headers.
   */
  public build(): BaRFinalResult {
    this.options?.hooks?.emit('before_build', {
      statusCode: this._statusCode,
    });

    const isSuccess =
      this._payload.success ??
      (this._statusCode >= 200 && this._statusCode < 400);

    const finalMetadata = MetadataFactory.create(
      {
        status_code: this._statusCode,
        ...this._metadata,
      },
      {
        request_id: this.context?.request_id,
      }
    );

    const result: BaRFinalResult = {
      body: {
        success: isSuccess,
        message:
          this._payload.message ||
          (isSuccess ? 'Operation successful' : 'Operation failed'),
        data: this._payload.data ?? null,
        timestamp: new Date().toISOString(),
        metadata: finalMetadata,
      },
      statusCode: this._statusCode,
      headers: this._headers,
    };

    this.options?.hooks?.emit('after_build', structuredClone(result));

    this.options?.logger?.debug?.('BaR built response', result);

    if (this.dispatcher) {
      this.options?.hooks?.emit('before_dispatch', structuredClone(result));

      const dispatched = this.dispatcher.dispatch(result);

      this.options?.hooks?.emit('after_dispatch', structuredClone(result));

      this.options?.logger?.info?.('BaR dispatched response', {
        statusCode: this._statusCode,
        success: isSuccess,
      });

      return dispatched;
    }

    return result;
  }
}