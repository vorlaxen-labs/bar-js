import { BaRContext } from "../types/bar-context.types";
import { IncomingHttpRequest, resolveRequestId } from "../utils/request-id.util";

export type BaRContextFactoryOptions = {
  requestIdHeaders?: readonly string[];
};

export class BaRContextFactory {
  public static create(
    req: IncomingHttpRequest,
    options: BaRContextFactoryOptions = {},
  ): BaRContext {
    return {
      request_id: resolveRequestId(req, options.requestIdHeaders),
      start_time: Date.now(),
    };
  }
}
