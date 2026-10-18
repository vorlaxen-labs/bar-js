import type { ResponseBuilder } from "../../core/response.factory";
import type { BaRContext } from "../../types/bar-context.types";

declare module "fastify" {
  interface FastifyRequest {
    bar: {
      ctx: BaRContext;
    };
  }

  interface FastifyReply {
    builder: ResponseBuilder;
  }
}

export {};
