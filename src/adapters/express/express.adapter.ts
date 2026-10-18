import {
  BarExpressNextFunction,
  BarExpressRequest,
  BarExpressResponse,
} from "./express.types";
import { ResponseBuilder } from "../../core/response.factory";
import { BaRContextFactory } from "../../core/context.factory";
import { DEFAULT_SECURITY_HEADERS } from "../../constants/security.constant";
import type { BarAdapterOptions } from "../shared/adapter-options.types";
import { ExpressDispatcher } from "./express.dispatcher";

export type BarExpressOptions = BarAdapterOptions;

export class BarExpressAdapter {
  constructor(private options: BarExpressOptions = {}) {}

  public handler() {
    return this.middleware.bind(this);
  }

  private middleware(
    req: BarExpressRequest,
    res: BarExpressResponse,
    next: BarExpressNextFunction,
  ) {
    const ctx = BaRContextFactory.create(req, {
      requestIdHeaders: this.options.requestIdHeaders,
    });

    if (this.options.withDefaultHeaders !== false) {
      const headers = this.options.defaultHeaders ?? DEFAULT_SECURITY_HEADERS;
      for (const [k, v] of Object.entries(headers)) {
        res.setHeader(k, v);
      }
    }

    req.bar = { ctx };

    const dispatcher = new ExpressDispatcher(res, this.options.logger);

    const builder = new ResponseBuilder(
      dispatcher,
      {
        logger: this.options.logger,
        hooks: this.options.hooks,
        environment: this.options.environment,
        includeStack: this.options.includeStack,
      },
      ctx,
    );

    res.builder = builder;

    next();
  }
}
