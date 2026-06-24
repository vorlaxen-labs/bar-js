import { StatusCodes } from '../constants/status-codes.constant';
import { IMetadata } from '../interfaces/IResponse.interface';
import { ResponseBuilder } from './response.factory';

export class ResponseAs<T, M extends IMetadata> {
  constructor(private readonly _builder: ResponseBuilder<T, M>) {}

  private clientError(
    status: number,
    message: string,
  ): ResponseBuilder<T, M> {
    return this._builder
      .status(status)
      .data(null as T)
      .message(message)
      .forceSuccess(false);
  }

  private serverError(
    status: number,
    message: string,
  ): ResponseBuilder<T, M> {
    return this.clientError(status, message);
  }

  // --- SUCCESSFUL (2xx) ---

  public ok(data?: T, message: string = 'Success'): ResponseBuilder<T, M> {
    return this._builder
      .status(StatusCodes.SUCCESSFUL.OK)
      .data((data ?? null) as T)
      .message(message);
  }

  public created(data?: T, message: string = 'Resource created'): ResponseBuilder<T, M> {
    return this._builder
      .status(StatusCodes.SUCCESSFUL.CREATED)
      .data((data ?? null) as T)
      .message(message);
  }

  public accepted(message: string = 'Request accepted'): ResponseBuilder<T, M> {
    return this._builder.status(StatusCodes.SUCCESSFUL.ACCEPTED).message(message);
  }

  public noContent(): ResponseBuilder<T, M> {
    return this._builder
      .status(StatusCodes.SUCCESSFUL.NO_CONTENT)
      .data(null as T)
      .message('');
  }

  // --- CLIENT ERRORS (4xx) ---

  public badRequest(message: string = 'Bad Request'): ResponseBuilder<T, M> {
    return this.clientError(StatusCodes.CLIENT_ERROR.BAD_REQUEST, message);
  }

  public unauthorized(message: string = 'Unauthorized access'): ResponseBuilder<T, M> {
    return this.clientError(StatusCodes.CLIENT_ERROR.UNAUTHORIZED, message);
  }

  public forbidden(message: string = 'Access forbidden'): ResponseBuilder<T, M> {
    return this.clientError(StatusCodes.CLIENT_ERROR.FORBIDDEN, message);
  }

  public notFound(message: string = 'Resource not found'): ResponseBuilder<T, M> {
    return this.clientError(StatusCodes.CLIENT_ERROR.NOT_FOUND, message);
  }

  public conflict(message: string = 'Conflict detected'): ResponseBuilder<T, M> {
    return this.clientError(StatusCodes.CLIENT_ERROR.CONFLICT, message);
  }

  public unprocessable(message: string = 'Unprocessable entity'): ResponseBuilder<T, M> {
    return this.clientError(StatusCodes.CLIENT_ERROR.UNPROCESSABLE_ENTITY, message);
  }

  public tooManyRequests(message: string = 'Too many requests, please slow down'): ResponseBuilder<T, M> {
    return this.clientError(StatusCodes.CLIENT_ERROR.TOO_MANY_REQUESTS, message);
  }

  // --- SERVER ERRORS (5xx) ---

  public internalServerError(message: string = 'Internal server error'): ResponseBuilder<T, M> {
    return this.serverError(StatusCodes.SERVER_ERROR.INTERNAL_SERVER_ERROR, message);
  }

  public serviceUnavailable(message: string = 'Service temporarily unavailable'): ResponseBuilder<T, M> {
    return this.serverError(StatusCodes.SERVER_ERROR.SERVICE_UNAVAILABLE, message);
  }

  public gatewayTimeout(message: string = 'Gateway timeout'): ResponseBuilder<T, M> {
    return this.serverError(StatusCodes.SERVER_ERROR.GATEWAY_TIMEOUT, message);
  }
}
