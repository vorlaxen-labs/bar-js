import { CryptoUtil } from "./crypto.util";

export type IncomingHttpRequest = {
  headers?: Record<string, string | string[] | undefined>;
  get?: (header: string) => string | undefined;
};

const DEFAULT_REQUEST_ID_HEADERS = [
  "x-request-id",
  "x-correlation-id",
  "traceparent",
] as const;

function readHeader(req: IncomingHttpRequest, name: string): string | undefined {
  const fromGet = req.get?.(name);
  if (fromGet) return fromGet;

  const headers = req.headers;
  if (!headers) return undefined;

  const direct = headers[name] ?? headers[name.toLowerCase()];
  if (direct === undefined) return undefined;

  return Array.isArray(direct) ? direct[0] : direct;
}

function traceIdFromTraceparent(traceparent: string): string | undefined {
  const parts = traceparent.trim().split("-");
  if (parts.length < 2) return undefined;

  const traceId = parts[1];
  if (!/^[0-9a-f]{32}$/i.test(traceId)) return undefined;

  return `${traceId.slice(0, 8)}-${traceId.slice(8, 12)}-${traceId.slice(12, 16)}-${traceId.slice(16, 20)}-${traceId.slice(20)}`;
}

/**
 * Resolves a request/correlation id from incoming headers or generates a new UUID.
 */
export function resolveRequestId(
  req: IncomingHttpRequest,
  headerNames: readonly string[] = DEFAULT_REQUEST_ID_HEADERS,
): string {
  for (const name of headerNames) {
    const raw = readHeader(req, name);
    if (!raw?.trim()) continue;

    if (name === "traceparent") {
      const traceId = traceIdFromTraceparent(raw);
      if (traceId) return traceId;
      continue;
    }

    const id = raw.trim();
    if (CryptoUtil.isValidUUID(id)) return id;

    return id;
  }

  return CryptoUtil.generateUUID();
}
