import { ResponseBuilder } from '../core';
import { BaRContext } from './bar-context.types';

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