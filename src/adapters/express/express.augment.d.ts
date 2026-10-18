import type { ResponseBuilder } from "../../core/response.factory";
import type { BaRContext } from "../../types/bar-context.types";

declare global {
  namespace Express {
    interface Request {
      bar: {
        ctx: BaRContext;
      };
    }

    interface Response {
      builder: ResponseBuilder;
    }
  }
}

export {};
