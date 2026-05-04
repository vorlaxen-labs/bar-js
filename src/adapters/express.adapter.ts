import { NextFunction, Request, Response } from "express";
import { BaRFinalResult, IBaRDispatcher, Logger } from "../interfaces";
import { BaR, BaRHooks, DEFAULT_SECURITY_HEADERS } from "..";
import { BaRContextFactory } from "../core/context.factory";

export class ExpressDispatcher implements IBaRDispatcher {
    constructor(private res: Response) { }

    dispatch(result: BaRFinalResult): BaRFinalResult {
        if (this.res.headersSent) return result;

        for (const [k, v] of Object.entries(result.headers)) {
            this.res.setHeader(k, v);
        }

        this.res.status(result.statusCode).json(result.body);

        return result;
    }
}

export type BarExpressOptions = {
    withDefaultHeaders?: boolean;
    logger?: Logger;
    hooks?: BaRHooks;
    defaultHeaders?: Record<string, string>;
};

export class BarExpressAdapter {
    constructor(private options: BarExpressOptions = {}) { }

    public handler() {
        return this.middleware.bind(this);
    }

    private middleware(req: Request, res: Response, next: NextFunction) {
        const ctx = BaRContextFactory.create(req);

        // withDefaultHeaders aktifse security header'ları set et
        if (this.options.withDefaultHeaders !== false) {
            const headers = this.options.defaultHeaders ?? DEFAULT_SECURITY_HEADERS;
            for (const [k, v] of Object.entries(headers)) {
                res.setHeader(k, v);
            }
        }

        res.bar = { ctx };

        const dispatcher = new ExpressDispatcher(res);

        const builder = new BaR(dispatcher, {
            logger: this.options.logger,
            hooks: this.options.hooks,
        }, ctx);

        res.builder = builder;

        next();
    }
}