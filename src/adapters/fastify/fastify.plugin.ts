import type {
  FastifyInstance,
  FastifyPluginAsync,
} from "fastify";
import { ResponseBuilder } from "../../core/response.factory";
import { BaRContextFactory } from "../../core/context.factory";
import { DEFAULT_SECURITY_HEADERS } from "../../constants/security.constant";
import type { BarAdapterOptions } from "../shared/adapter-options.types";
import { FastifyDispatcher } from "./fastify.dispatcher";
import { BarFastifyReply, BarFastifyRequest } from "./fastify.types";

export type BarFastifyOptions = BarAdapterOptions;

function applyBarFastify(
  fastify: FastifyInstance,
  options: BarFastifyOptions,
): void {
  fastify.addHook("onRequest", async (request, reply) => {
    const req = request as BarFastifyRequest;
    const res = reply as BarFastifyReply;

    const ctx = BaRContextFactory.create(req, {
      requestIdHeaders: options.requestIdHeaders,
    });

    if (options.withDefaultHeaders !== false) {
      const headers = options.defaultHeaders ?? DEFAULT_SECURITY_HEADERS;
      for (const [k, v] of Object.entries(headers)) {
        res.header(k, v);
      }
    }

    req.bar = { ctx };

    const dispatcher = new FastifyDispatcher(res, options.logger);

    const builder = new ResponseBuilder(
      dispatcher,
      {
        logger: options.logger,
        hooks: options.hooks,
        environment: options.environment,
        includeStack: options.includeStack,
      },
      ctx,
    );

    res.builder = builder;
  });
}

export const BarFastifyPlugin: FastifyPluginAsync<BarFastifyOptions> = async (
  fastify,
  options,
) => {
  applyBarFastify(fastify, options);
};

/** Attaches BaR hooks on the given Fastify instance (register routes after this). */
export function registerBarFastify(
  app: FastifyInstance,
  options: BarFastifyOptions = {},
): void {
  applyBarFastify(app, options);
}
