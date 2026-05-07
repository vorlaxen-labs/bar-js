import { randomUUID } from "crypto";
import { Request } from "express";
import { BaRContext } from "../types/bar-context.types";

export class BaRContextFactory {
  public static create(req: Request): BaRContext {
    return {
      request_id: randomUUID(),
      start_time: Date.now()
    };
  }
}