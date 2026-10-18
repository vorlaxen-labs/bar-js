# API reference

This page reflects the **2.x** public API. Types and behavior match the published `@vorlaxen-labs/bar-js` package.

## Package exports

| Subpath | Exports (high level) |
|---------|----------------------|
| `@vorlaxen-labs/bar-js` | `ResponseBuilder`, `BaR`, `BaRHooks`, `MetadataFactory`, `BaRContextFactory`, `ResponseAs`, interfaces, `StatusCodes`, `DEFAULT_SECURITY_HEADERS`, `NO_BODY_STATUS_CODES`, `shouldSendResponseBody`, etc. |
| `@vorlaxen-labs/bar-js/adapters/express` | `BarExpressAdapter`, `ExpressDispatcher`, `BarExpressOptions`, Express types |
| `@vorlaxen-labs/bar-js/adapters/fastify` | `BarFastifyPlugin`, `registerBarFastify`, `FastifyDispatcher`, `BarFastifyOptions`, Fastify types |

`BaR` is an alias for `ResponseBuilder`.

---

## Standard response schema

Success and error bodies share `timestamp` and `metadata`; they differ by payload shape.

```typescript
type SuccessBody<T> = {
  success: true;
  timestamp: string;
  message: string;
  data: T | null;
  metadata: Metadata;
};

type ErrorBody = {
  success: false;
  timestamp: string;
  data: null;
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string; code?: string }>;
  };
  metadata: Metadata;
};
```

| Field | Description |
|-------|-------------|
| `success` | `true` when `200 <= status < 400` unless `forceSuccess()` overrides. Error presets set `false`. |
| `timestamp` | Set when `.build()` runs. |
| `message` | **Success only.** From `.message()` or preset; default `"Operation successful"`. |
| `error` | **Failure only.** Structured error from `.as.*`, `.withError()`, or `wrap()` rejection. |
| `data` | Success payload; `null` on errors and on `.as.noContent()`. |
| `metadata` | Always includes `request_id`, `server_time`, `status_code`; extended via `setMeta()` / `paginate()`. |

Example:

```json
{
  "success": true,
  "timestamp": "2026-05-04T13:52:00.000Z",
  "message": "Success",
  "data": { "hello": "world" },
  "metadata": {
    "status_code": 200,
    "request_id": "fddc7272-4405-4001-9858-ab40007bfa11",
    "server_time": "2026-05-04T13:52:00.000Z"
  }
}
```

---

## Semantic presets (`.as`)

Access via `builder.as`. All presets return the same `ResponseBuilder` for further chaining.

### Successful (2xx)

| Method | Status | Default message | Notes |
|--------|--------|-----------------|-------|
| `ok(data?, message?)` | 200 | `"Success"` | `data` defaults to `null` if omitted |
| `created(data?, message?)` | 201 | `"Resource created"` | |
| `accepted(message?)` | 202 | `"Request accepted"` | Does not set `data` |
| `noContent()` | 204 | `""` | Sets `data` to `null`; body may not be sent on dispatch (see below) |

### Client errors (4xx)

All call `forceSuccess(false)` and set `data` to `null`.

| Method | Status | Default message |
|--------|--------|-----------------|
| `badRequest(message?)` | 400 | `"Bad Request"` |
| `unauthorized(message?)` | 401 | `"Unauthorized access"` |
| `forbidden(message?)` | 403 | `"Access forbidden"` |
| `notFound(message?)` | 404 | `"Resource not found"` |
| `conflict(message?)` | 409 | `"Conflict detected"` |
| `unprocessable(message?)` | 422 | `"Unprocessable entity"` |
| `validationError(errors, message?)` | 422 | `"Validation failed"` — normalizes Zod/Joi/class-validator into `error.details` |
| `tooManyRequests(message?)` | 429 | `"Too many requests, please slow down"` |

### Server errors (5xx)

Same as client errors: `success: false`, `data: null`.

| Method | Status | Default message |
|--------|--------|-----------------|
| `internalServerError(message?)` | 500 | `"Internal server error"` |
| `serviceUnavailable(message?)` | 503 | `"Service temporarily unavailable"` |
| `gatewayTimeout(message?)` | 504 | `"Gateway timeout"` |

---

## ResponseBuilder methods

Constructor:

```typescript
new ResponseBuilder(
  dispatcher?: IBaRDispatcher,
  options?: ResponseBuilderOptions,
  context?: BaRContext,
)
```

`BaRContext`: `{ request_id: string; start_time: number }`.

### Chain methods

| Method | Description |
|--------|-------------|
| `status(code: number)` | HTTP status; clears any `forceSuccess()` override |
| `forceSuccess(value: boolean)` | Override inferred `success` |
| `message(msg: string)` | Response message |
| `data(data: T \| null)` | Payload |
| `setMeta(meta: Partial<M>)` | Shallow-merge into metadata |
| `withMetadata(options?)` | Merge fields from `MetadataFactory.create` |
| `paginate(data, options)` | Sets `data` and `metadata.pagination` (`strategy: 'offset' \| 'cursor'`) |
| `withError(error)` | Structured `error` on failure responses |
| `setHeaders(key, value)` | Single header |
| `setHeaders(headers)` | Multiple headers |
| `header(key, value)` | Alias for single `setHeaders` |
| `setCookies(name, value, options?)` | Queue one cookie |
| `setCookies(cookies, options?)` | Queue many cookies (shared options optional) |
| `wrap(promise: Promise<T>)` | Async: resolve → `data()`; reject → 500 + `forceSuccess(false)` |
| `transform(fn)` | Map `data` when not `null`; returns new generic builder |
| `when(condition, fn)` | Run `fn(builder)` if `condition` |
| `as` | Getter for `ResponseAs` presets |
| `build()` | Assemble and optionally dispatch; returns `BaRFinalResult` |

### `ResponseBuilderOptions`

| Field | Description |
|-------|-------------|
| `defaultHeaders` | Not used by builder directly; adapters use adapter-level `defaultHeaders` |
| `environment` | `'development' \| 'production' \| 'test'` — affects `wrap()` error messages |
| `includeStack` | When true and not production, `wrap()` may expose `error.stack` |
| `logger` | Debug/info logging around build/dispatch |
| `hooks` | `BaRHooks` instance |

### `wrap()` error behavior

| Condition | Client message |
|-----------|----------------|
| `environment === 'production'` | `"Internal Server Error"` |
| Non-production, `Error` instance | `error.message`, or `error.stack` if `includeStack` |
| Non-production, non-Error | `"Internal Server Error"` |

On rejection, emits hook event **`error`** with `{ error, message, statusCode }`.

---

## BaRFinalResult and IBaRDispatcher

```typescript
interface BaRFinalResult {
  body: IResponse<unknown>;
  statusCode: number;
  headers: Record<string, HeaderValue>;
  cookies: QueuedCookie[];
}

interface IBaRDispatcher {
  dispatch(result: BaRFinalResult): BaRFinalResult;
}
```

`HeaderValue`: `string | number | readonly string[]`.

`QueuedCookie`: `{ name, value, options? }`.

Built-in dispatchers skip sending a JSON body when `shouldSendResponseBody(statusCode)` is false (statuses **204**, **205**, **304**).

---

## BaRHooks

```typescript
class BaRHooks {
  constructor(logger?: Logger);
  on(event: BaRHookEvent, fn: (payload: unknown) => void): void;
  hasListeners(event: BaRHookEvent): boolean;
  emit(event: BaRHookEvent, payload: unknown): void;
}
```

### Hook events

| Event | Payload (typical) |
|-------|-------------------|
| `before_build` | `{ statusCode: number }` |
| `after_build` | `BaRFinalResult` (clone) |
| `before_dispatch` | `BaRFinalResult` (clone) |
| `after_dispatch` | `BaRFinalResult` (clone) |
| `error` | From `wrap()`: `{ error, message, statusCode }`. From hook failure: `{ sourceEvent, error, payload }` |

Hook order during `.build()`:

`before_build` → assemble → `after_build` → `before_dispatch` → `dispatch` → `after_dispatch`

---

## BarAdapterOptions

Used by `BarExpressAdapter`, `BarFastifyPlugin`, and `registerBarFastify`:

| Field | Type |
|-------|------|
| `withDefaultHeaders` | `boolean` (default effective: `true`) |
| `defaultHeaders` | `Record<string, string>` |
| `logger` | `Logger` |
| `hooks` | `BaRHooks` |
| `requestIdHeaders` | `readonly string[]` |
| `environment` | `'development' \| 'production' \| 'test'` |
| `includeStack` | `boolean` |

---

## DEFAULT_SECURITY_HEADERS

Applied by adapters when `withDefaultHeaders !== false` (unless overridden by `defaultHeaders`):

| Header | Value |
|--------|--------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | `default-src 'none'; frame-ancestors 'none';` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cache-Control` | `no-store` |
| `Pragma` | `no-cache` |
| `X-DNS-Prefetch-Control` | `off` |

---

## HTTP body rules

```typescript
const NO_BODY_STATUS_CODES = new Set([204, 205, 304]);

function shouldSendResponseBody(statusCode: number): boolean;
```

Express and Fastify dispatchers call `end()` without JSON when the status is in this set.

---

## Pagination metadata

`paginate(data, options)` sets payload and adds `metadata.pagination`:

```typescript
// Offset (page-based)
.paginate(users, { strategy: 'offset', total: 100, page: 2, limit: 20 });

// Cursor
.paginate(users, { strategy: 'cursor', limit: 20, next_cursor: 'abc', prev_cursor: null });
```

Offset shape: `{ strategy: 'offset', total, page, limit, total_pages, has_next, has_prev }`.

Cursor shape: `{ strategy: 'cursor', limit, next_cursor, prev_cursor, has_next, has_prev }`.

Throws if `limit <= 0`.

---

## Logger

```typescript
interface Logger {
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
  debug?(message: string, meta?: unknown): void;
}
```

---

## Next steps

- [Getting started](./getting-started.md)
- [Adapters](./adapters.md)
- [Advanced chaining](./advanced-chaining.md)
