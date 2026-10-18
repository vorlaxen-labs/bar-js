import type { BaRHooks } from "../../src";
import type { HttpRequestBody } from "./http-request.types";

export type AdapterName = "express" | "fastify";

export type BarHttpHeaders = Record<
  string,
  string | number | string[] | undefined
>;

export type BarHttpResponse = {
  status: number;
  headers: BarHttpHeaders;
  body: Record<string, unknown> | null;
  text: string;
};

export type TestAppOptions = {
  withDefaultHeaders?: boolean;
  environment?: "development" | "production" | "test";
  hooks?: BaRHooks;
};

export type ScenarioExpect = {
  status: number;
  bodyPartial?: Record<string, unknown>;
  bodyAssert?: (body: Record<string, unknown>) => void;
  emptyBody?: boolean;
  responseHeaders?: Record<string, string | RegExp>;
  cookies?: { name: string; flags?: string[] };
  metadataPartial?: Record<string, unknown>;
  assertSuccessShape?: boolean;
  assertErrorShape?: boolean;
  timestampIso?: boolean;
  messageMustNotContain?: string;
};

export type ScenarioCase = {
  name: string;
  path: string;
  method?: "GET" | "POST";
  body?: HttpRequestBody;
  requestHeaders?: Record<string, string>;
  appOptions?: TestAppOptions;
  expect: ScenarioExpect;
};
