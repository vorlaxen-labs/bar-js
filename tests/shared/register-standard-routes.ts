import type { Express, Request, Response } from "express";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { STANDARD_ROUTE_PATHS as P } from "./route-paths";

type ExpressHandler = (req: Request, res: Response) => unknown;

type FastifyHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
) => unknown;

const handlers = {
  ok: {
    express: (_req: Request, res: Response) =>
      res.builder.as.ok({ hello: "world" }, "All good").build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder.as.ok({ hello: "world" }, "All good").build(),
  },
  error: {
    express: (_req: Request, res: Response) =>
      res.builder.as.unauthorized("Nope").build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder.as.unauthorized("Nope").build(),
  },
  created: {
    express: (_req: Request, res: Response) =>
      res.builder.as
        .created({ id: 42, name: "test" }, "Resource created")
        .build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder.as
        .created({ id: 42, name: "test" }, "Resource created")
        .build(),
  },
  notFound: {
    express: (_req: Request, res: Response) =>
      res.builder.as.notFound("Resource not found").build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder.as.notFound("Resource not found").build(),
  },
  badRequest: {
    express: (_req: Request, res: Response) =>
      res.builder.as.badRequest("Invalid parameters").build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder.as.badRequest("Invalid parameters").build(),
  },
  forbidden: {
    express: (_req: Request, res: Response) =>
      res.builder.as.forbidden("Access denied").build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder.as.forbidden("Access denied").build(),
  },
  conflict: {
    express: (_req: Request, res: Response) =>
      res.builder.as.conflict("Resource already exists").build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder.as.conflict("Resource already exists").build(),
  },
  internalError: {
    express: (_req: Request, res: Response) =>
      res.builder.as.internalServerError("Something went wrong").build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder.as.internalServerError("Something went wrong").build(),
  },
  noContent: {
    express: (_req: Request, res: Response) =>
      res.builder.as.noContent().build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder.as.noContent().build(),
  },
  customHeaders: {
    express: (_req: Request, res: Response) =>
      res.builder
        .status(200)
        .message("Custom header test")
        .data({ ok: true })
        .header("X-Custom-Header", "bar-test")
        .setHeaders("X-Request-Source", "unit-test")
        .build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder
        .status(200)
        .message("Custom header test")
        .data({ ok: true })
        .header("X-Custom-Header", "bar-test")
        .setHeaders("X-Request-Source", "unit-test")
        .build(),
  },
  customMeta: {
    express: (_req: Request, res: Response) =>
      res.builder
        .status(200)
        .message("Meta test")
        .data({ ok: true })
        .setMeta({ custom_field: "custom_value", version: "1.0.0" } as never)
        .build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder
        .status(200)
        .message("Meta test")
        .data({ ok: true })
        .setMeta({ custom_field: "custom_value", version: "1.0.0" } as never)
        .build(),
  },
  barCtx: {
    express: (req: Request, res: Response) =>
      res.builder
        .as.ok(
          {
            request_id: req.bar.ctx.request_id,
            start_time: req.bar.ctx.start_time,
          },
          "Context available",
        )
        .build(),
    fastify: (request: FastifyRequest, reply: FastifyReply) =>
      reply.builder
        .as.ok(
          {
            request_id: request.bar.ctx.request_id,
            start_time: request.bar.ctx.start_time,
          },
          "Context available",
        )
        .build(),
  },
  explicitSuccessOverride: {
    express: (_req: Request, res: Response) =>
      res.builder
        .status(200)
        .forceSuccess(false)
        .message("Forced failure")
        .data(null)
        .build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder
        .status(200)
        .forceSuccess(false)
        .message("Forced failure")
        .data(null)
        .build(),
  },
  cookies: {
    express: (_req: Request, res: Response) =>
      res.builder
        .as.ok({ ok: true })
        .setCookies("session", "abc", { httpOnly: true })
        .build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder
        .as.ok({ ok: true })
        .setCookies("session", "abc", { httpOnly: true })
        .build(),
  },
  staleDataAfterError: {
    express: (_req: Request, res: Response) =>
      res.builder.data({ secret: "should-not-leak" }).as.notFound("Gone").build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder.data({ secret: "should-not-leak" }).as.notFound("Gone").build(),
  },
  wrapProd: {
    express: async (_req: Request, res: Response) => {
      await res.builder.wrap(Promise.reject(new Error("DB connection leaked")));
      return res.builder.build();
    },
    fastify: async (_req: FastifyRequest, reply: FastifyReply) => {
      await reply.builder.wrap(Promise.reject(new Error("DB connection leaked")));
      return reply.builder.build();
    },
  },
  doubleSend: {
    express: (_req: Request, res: Response) => {
      res.status(200).send("already");
      return res.builder.as.ok({ ignored: true }).build();
    },
    fastify: (_req: FastifyRequest, reply: FastifyReply) => {
      reply.status(200).send("already");
      return reply.builder.as.ok({ ignored: true }).build();
    },
  },
  okUndefinedData: {
    express: (_req: Request, res: Response) =>
      res.builder.as.ok(undefined, "No payload").build(),
    fastify: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.builder.as.ok(undefined, "No payload").build(),
  },
} as const;

function mountExpressRoute(
  app: Express,
  path: string,
  handler: ExpressHandler,
): void {
  app.get(path, handler);
}

function mountFastifyRoute(
  app: FastifyInstance,
  path: string,
  handler: FastifyHandler,
): void {
  app.get(path, handler);
}

export function mountStandardRoutesExpress(app: Express): void {
  mountExpressRoute(app, P.ok, handlers.ok.express);
  mountExpressRoute(app, P.error, handlers.error.express);
  mountExpressRoute(app, P.created, handlers.created.express);
  mountExpressRoute(app, P.notFound, handlers.notFound.express);
  mountExpressRoute(app, P.badRequest, handlers.badRequest.express);
  mountExpressRoute(app, P.forbidden, handlers.forbidden.express);
  mountExpressRoute(app, P.conflict, handlers.conflict.express);
  mountExpressRoute(app, P.internalError, handlers.internalError.express);
  mountExpressRoute(app, P.noContent, handlers.noContent.express);
  mountExpressRoute(app, P.customHeaders, handlers.customHeaders.express);
  mountExpressRoute(app, P.customMeta, handlers.customMeta.express);
  mountExpressRoute(app, P.barCtx, handlers.barCtx.express);
  mountExpressRoute(
    app,
    P.explicitSuccessOverride,
    handlers.explicitSuccessOverride.express,
  );
  mountExpressRoute(app, P.cookies, handlers.cookies.express);
  mountExpressRoute(
    app,
    P.staleDataAfterError,
    handlers.staleDataAfterError.express,
  );
  mountExpressRoute(app, P.wrapProd, handlers.wrapProd.express);
  mountExpressRoute(app, P.doubleSend, handlers.doubleSend.express);
  mountExpressRoute(app, P.okUndefinedData, handlers.okUndefinedData.express);
}

export function mountStandardRoutesFastify(app: FastifyInstance): void {
  mountFastifyRoute(app, P.ok, handlers.ok.fastify);
  mountFastifyRoute(app, P.error, handlers.error.fastify);
  mountFastifyRoute(app, P.created, handlers.created.fastify);
  mountFastifyRoute(app, P.notFound, handlers.notFound.fastify);
  mountFastifyRoute(app, P.badRequest, handlers.badRequest.fastify);
  mountFastifyRoute(app, P.forbidden, handlers.forbidden.fastify);
  mountFastifyRoute(app, P.conflict, handlers.conflict.fastify);
  mountFastifyRoute(app, P.internalError, handlers.internalError.fastify);
  mountFastifyRoute(app, P.noContent, handlers.noContent.fastify);
  mountFastifyRoute(app, P.customHeaders, handlers.customHeaders.fastify);
  mountFastifyRoute(app, P.customMeta, handlers.customMeta.fastify);
  mountFastifyRoute(app, P.barCtx, handlers.barCtx.fastify);
  mountFastifyRoute(
    app,
    P.explicitSuccessOverride,
    handlers.explicitSuccessOverride.fastify,
  );
  mountFastifyRoute(app, P.cookies, handlers.cookies.fastify);
  mountFastifyRoute(
    app,
    P.staleDataAfterError,
    handlers.staleDataAfterError.fastify,
  );
  mountFastifyRoute(app, P.wrapProd, handlers.wrapProd.fastify);
  mountFastifyRoute(app, P.doubleSend, handlers.doubleSend.fastify);
  mountFastifyRoute(app, P.okUndefinedData, handlers.okUndefinedData.fastify);
}
