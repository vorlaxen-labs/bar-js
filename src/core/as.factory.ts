import { StatusCodes } from '../constants/status-codes.constant';
import { ResponseBuilder } from './response.factory';

/**
 * @class ResponseAs
 * @description Provides semantic presets for the ResponseBuilder using standardized status codes.
 */
export class ResponseAs<T, M extends Record<string, any>> {
  constructor(private readonly _builder: ResponseBuilder<T, M>) {}

  // --- SUCCESSFUL (2xx) ---

  public ok(data?: T, message: string = 'Success'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.SUCCESSFUL.OK).data(data as T).message(message);
  }

  public created(data?: T, message: string = 'Resource created'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.SUCCESSFUL.CREATED).data(data as T).message(message);
  }

  public accepted(message: string = 'Request accepted'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.SUCCESSFUL.ACCEPTED).message(message);
  }

  public noContent(): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.SUCCESSFUL.NO_CONTENT).data(null as any);
  }

  // --- CLIENT ERRORS (4xx) ---

  public badRequest(message: string = 'Bad Request'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.CLIENT_ERROR.BAD_REQUEST).message(message).success(false);
  }

  public unauthorized(message: string = 'Unauthorized access'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.CLIENT_ERROR.UNAUTHORIZED).message(message).success(false);
  }

  public forbidden(message: string = 'Access forbidden'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.CLIENT_ERROR.FORBIDDEN).message(message).success(false);
  }

  public notFound(message: string = 'Resource not found'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.CLIENT_ERROR.NOT_FOUND).message(message).success(false);
  }

  public conflict(message: string = 'Conflict detected'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.CLIENT_ERROR.CONFLICT).message(message).success(false);
  }

  public unprocessable(message: string = 'Unprocessable entity'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.CLIENT_ERROR.UNPROCESSABLE_ENTITY).message(message).success(false);
  }

  public tooManyRequests(message: string = 'Too many requests, please slow down'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.CLIENT_ERROR.TOO_MANY_REQUESTS).message(message).success(false);
  }

  // --- SERVER ERRORS (5xx) ---

  public internalServerError(message: string = 'Internal server error'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.SERVER_ERROR.INTERNAL_SERVER_ERROR).message(message).success(false);
  }

  public serviceUnavailable(message: string = 'Service temporarily unavailable'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.SERVER_ERROR.SERVICE_UNAVAILABLE).message(message).success(false);
  }

  public gatewayTimeout(message: string = 'Gateway timeout'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.SERVER_ERROR.GATEWAY_TIMEOUT).message(message).success(false);
  }
}