import { ResponseBuilder } from '@/core/response.factory';
import { BaRContext } from './bar-context.types';

declare global {
    namespace Express {
        interface Response {
            builder: ResponseBuilder;
            bar: {
                ctx: BaRContext;
            };
        }
    }
}

export {};