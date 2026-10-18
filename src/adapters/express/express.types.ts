import type { ResponseBuilder } from "../../core/response.factory";
import type { CookieOptions } from "../../interfaces/IDispatcher.interface";
import type { BaRContext } from "../../types/bar-context.types";
import type { IncomingHttpRequest } from "../../utils/request-id.util";

/** Minimal Express `Request` shape used by {@link BarExpressAdapter}. */
export type BarExpressRequest = IncomingHttpRequest & {
  bar?: { ctx: BaRContext };
};

/** Minimal Express `Response` shape used by {@link ExpressDispatcher}. */
export interface BarExpressResponse {
  headersSent: boolean;
  builder?: ResponseBuilder;
  setHeader(name: string, value: number | string | readonly string[]): unknown;
  status(code: number): this;
  json(body: unknown): unknown;
  end(): void;
  cookie(name: string, value: string, options?: CookieOptions): unknown;
}

export type BarExpressNextFunction = (err?: unknown) => void;
