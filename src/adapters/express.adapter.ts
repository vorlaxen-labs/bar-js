import { NextFunction, Request, Response } from "express";
import { BaRFinalResult, IBaRDispatcher, Logger } from "../interfaces";
import { BaR, BaRHooks, DEFAULT_SECURITY_HEADERS } from "..";
import { BaRContextFactory } from "../core/context.factory";
import { shouldSendResponseBody } from "../constants/http.constant";

export class ExpressDispatcher implements IBaRDispatcher {
  constructor(
    private res: Response,
    private logger?: Logger,
  ) {}

  dispatch(result: BaRFinalResult): BaRFinalResult {
    if (this.res.headersSent) {
      this.logger?.warn?.("BaR dispatch skipped: response headers already sent", {
        statusCode: result.statusCode,
      });
      return result;
    }

    for (const [k, v] of Object.entries(result.headers)) {
      this.res.setHeader(k, v);
    }

    if (result.cookies?.length) {
      for (const cookie of result.cookies) {
        this.res.cookie(cookie.name, cookie.value, cookie.options || {});
      }
    }

    this.res.status(result.statusCode);

    if (shouldSendResponseBody(result.statusCode)) {
      this.res.json(result.body);
    } else {
      this.res.end();
    }

    return result;
  }
}

export type BarExpressOptions = {
  withDefaultHeaders?: boolean;
  logger?: Logger;
  hooks?: BaRHooks;
  defaultHeaders?: Record<string, string>;
  requestIdHeaders?: readonly string[];
  environment?: "development" | "production" | "test";
  includeStack?: boolean;
};

export class BarExpressAdapter {
  constructor(private options: BarExpressOptions = {}) {}

  public handler() {
    return this.middleware.bind(this);
  }

  private middleware(req: Request, res: Response, next: NextFunction) {
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

    const builder = new BaR(
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
