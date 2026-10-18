import { BaRHooks } from "../../core/hook.factory";
import { Logger } from "../../interfaces/IResponse.interface";

export type BarAdapterOptions = {
  withDefaultHeaders?: boolean;
  logger?: Logger;
  hooks?: BaRHooks;
  defaultHeaders?: Record<string, string>;
  requestIdHeaders?: readonly string[];
  environment?: "development" | "production" | "test";
  includeStack?: boolean;
};
