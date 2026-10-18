import request from "supertest";
import type { ExpressTestApp } from "../apps/create-express-app";
import type { BarHttpHeaders, BarHttpResponse } from "../shared/types";
import type { HttpRequestOptions } from "../shared/http-request.types";

function normalizeSupertestResponse(res: request.Response): BarHttpResponse {
  const body =
    res.body && typeof res.body === "object" && Object.keys(res.body).length > 0
      ? (res.body as Record<string, unknown>)
      : res.status === 204 || res.text === ""
        ? null
        : (res.body as Record<string, unknown>);

  return {
    status: res.status,
    headers: res.headers as BarHttpHeaders,
    body,
    text: res.text,
  };
}

export async function hitExpress(
  app: ExpressTestApp,
  options: HttpRequestOptions,
): Promise<BarHttpResponse> {
  const method = (options.method ?? "GET").toLowerCase() as "get" | "post";
  let req = request(app)[method](options.path);

  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      req = req.set(key, value);
    }
  }

  if (options.body !== undefined && method === "post") {
    req = req.send(options.body);
  }

  const res = await req;
  return normalizeSupertestResponse(res);
}

export type { HttpRequestOptions };
