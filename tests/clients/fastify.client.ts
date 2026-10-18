import type { FastifyInstance, InjectOptions } from "fastify";
import type { BarHttpResponse } from "../shared/types";
import type { HttpRequestOptions } from "../shared/http-request.types";

function normalizeInjectResponse(res: {
  statusCode: number;
  headers: BarHttpResponse["headers"];
  body: string;
}): BarHttpResponse {
  const text = res.body ?? "";
  let body: Record<string, unknown> | null = null;

  if (text.length > 0) {
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      body = null;
    }
  }

  return {
    status: res.statusCode,
    headers: res.headers,
    body,
    text,
  };
}

export async function hitFastify(
  app: FastifyInstance,
  options: HttpRequestOptions,
): Promise<BarHttpResponse> {
  const injectOptions: InjectOptions = {
    method: options.method ?? "GET",
    url: options.path,
    headers: options.headers,
  };

  if (options.body !== undefined) {
    injectOptions.payload = options.body;
  }

  const res = await app.inject(injectOptions);

  return normalizeInjectResponse({
    statusCode: res.statusCode,
    headers: res.headers as BarHttpResponse["headers"],
    body: res.body,
  });
}
