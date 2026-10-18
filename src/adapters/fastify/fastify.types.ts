import type { ResponseBuilder } from "../../core/response.factory";
import type { CookieOptions } from "../../interfaces/IDispatcher.interface";
import type { BaRContext } from "../../types/bar-context.types";
import type { IncomingHttpRequest } from "../../utils/request-id.util";

/** Minimal Fastify `request` shape used by {@link BarFastifyPlugin}. */
export type BarFastifyRequest = IncomingHttpRequest & {
  bar?: { ctx: BaRContext };
};

/** Minimal Fastify `reply` shape used by {@link FastifyDispatcher}. */
export interface BarFastifyReply {
  sent: boolean;
  raw: { headersSent: boolean };
  builder?: ResponseBuilder;
  header(name: string, value: string | number | readonly string[]): this;
  status(code: number): this;
  send(payload?: unknown): unknown;
  setCookie?(name: string, value: string, options?: CookieOptions): this;
}
