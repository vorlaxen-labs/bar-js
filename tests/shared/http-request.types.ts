/** JSON-serializable request bodies used by test HTTP clients. */
export type JsonHttpBody = Record<string, unknown> | unknown[];

/** Payload supertest `.send()` and Fastify `inject()` accept. */
export type HttpRequestBody = string | JsonHttpBody;

export type HttpRequestOptions = {
  method?: "GET" | "POST";
  path: string;
  headers?: Record<string, string>;
  body?: HttpRequestBody;
};
