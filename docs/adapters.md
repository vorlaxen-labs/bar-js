# Adapters

BaR separates **building** a response from **delivering** it.

1. **`ResponseBuilder`** (`BaR`) — assembles `body`, `statusCode`, `headers`, and `cookies`.
2. **`IBaRDispatcher`** — sends that result through your HTTP stack.
3. **Adapters** — create per-request context, optional default headers, and a builder bound to a framework dispatcher.

> **BaR builds the response; the dispatcher delivers it.**

## Shared configuration

Express and Fastify adapters accept the same options type (`BarAdapterOptions`):

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `withDefaultHeaders` | `boolean` | `true` | When not `false`, sets security/cache headers on the raw response before your route runs. |
| `defaultHeaders` | `Record<string, string>` | `DEFAULT_SECURITY_HEADERS` | Header map used when `withDefaultHeaders` is enabled. |
| `logger` | `Logger` | `undefined` | Optional logger (`info`, `warn`, `error`, `debug?`). |
| `hooks` | `BaRHooks` | `undefined` | Lifecycle hooks shared by every builder on that app instance. |
| `environment` | `'development' \| 'production' \| 'test'` | `undefined` | When `'production'`, `wrap()` hides internal error messages from clients. |
| `includeStack` | `boolean` | `undefined` | When set with non-production `environment`, `wrap()` may expose `error.stack` as the message. |
| `requestIdHeaders` | `readonly string[]` | `x-request-id`, `x-correlation-id`, `traceparent` | Incoming headers used to resolve `request_id` (see [request ID resolution](#request-id-resolution)). |

Default security headers are documented in [API reference](./api-reference.md#default_security_headers).

---

## Express adapter

### Setup

```typescript
import express, { Request, Response } from 'express';
import '@vorlaxen-labs/bar-js/adapters/express';
import { BarExpressAdapter } from '@vorlaxen-labs/bar-js/adapters/express';

const app = express();
app.use(express.json());

const bar = new BarExpressAdapter({
  withDefaultHeaders: true,
  logger: console,
  hooks: myHooks,
  environment: 'production',
  defaultHeaders: {
    'X-API-Version': '1',
  },
});

app.use(bar.handler());
```

### Injected properties

| Property | Location | Description |
|----------|----------|-------------|
| `ctx` | `req.bar.ctx` | `request_id` (string), `start_time` (ms since epoch). |
| `builder` | `res.builder` | `ResponseBuilder` bound to `ExpressDispatcher` and `req.bar.ctx`. |

### Route example

```typescript
app.get('/api/example', (req: Request, res: Response) => {
  return res.builder
    .as.ok({ hello: 'world' }, 'Success')
    .build();
});
```

### What happens on `.build()`

1. Hooks: `before_build` → assemble JSON body + metadata → `after_build`
2. `ExpressDispatcher.dispatch()`:
   - Sets response headers from `result.headers`
   - Sets cookies via `res.cookie()` for each queued cookie
   - `res.status(statusCode).json(result.body)` — or `res.end()` when the status must not include a body (`204`, `205`, `304`)
3. Hooks: `before_dispatch` → `after_dispatch`

If headers were already sent, dispatch is skipped and a warning is logged.

---

## Fastify adapter

Install peers in your app: `fastify` and `@fastify/cookie`.

### Setup

Register **`@fastify/cookie` before** BaR so cookie dispatch works.

```typescript
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import '@vorlaxen-labs/bar-js/adapters/fastify';
import { BarFastifyPlugin, registerBarFastify } from '@vorlaxen-labs/bar-js/adapters/fastify';

const app = Fastify();

await app.register(cookie);

await registerBarFastify(app, {
  withDefaultHeaders: true,
  logger: console,
  hooks: myHooks,
  environment: 'production',
});

// Alternative: await app.register(BarFastifyPlugin, options);
```

Configuration matches the [shared table](#shared-configuration) above.

### Injected properties

| Property | Location | Description |
|----------|----------|-------------|
| `ctx` | `request.bar.ctx` | Same shape as Express. |
| `builder` | `reply.builder` | `ResponseBuilder` bound to `FastifyDispatcher`. |

### Route example

```typescript
app.get('/api/example', async (request, reply) => {
  return reply.builder
    .as.ok({ hello: 'world' }, 'Success')
    .build();
});
```

`FastifyDispatcher` uses `reply.setCookie` when `@fastify/cookie` is registered; otherwise cookies are skipped with a warning.

---

## Request ID resolution

`BaRContextFactory` resolves `request_id` from the first usable value among `requestIdHeaders`:

- **`x-request-id` / `x-correlation-id`:** trimmed value; valid UUIDs are kept as-is, other non-empty strings are accepted.
- **`traceparent`:** W3C trace id is parsed and normalized to a UUID-like string when valid.
- If no header yields an id, a new UUID is generated.

Override header names with `requestIdHeaders` on the adapter options.

---

## TypeScript augmentations

**Express** — import the adapter package:

```typescript
import '@vorlaxen-labs/bar-js/adapters/express';
```

- `req.bar.ctx` → request context
- `res.builder` → `ResponseBuilder`

**Fastify** — import:

```typescript
import '@vorlaxen-labs/bar-js/adapters/fastify';
```

- `request.bar.ctx` → request context
- `reply.builder` → `ResponseBuilder`

---

## Vanilla Node.js (no adapter)

Use `BaR` (alias of `ResponseBuilder`) with your own dispatcher, or without one to only obtain a result object:

```typescript
import { BaR, IBaRDispatcher, BaRFinalResult } from '@vorlaxen-labs/bar-js';
import type { ServerResponse } from 'http';

class NodeDispatcher implements IBaRDispatcher {
  constructor(private res: ServerResponse) {}

  dispatch(result: BaRFinalResult): BaRFinalResult {
    const headers = { 'Content-Type': 'application/json', ...result.headers };
    this.res.writeHead(result.statusCode, headers);
    this.res.end(JSON.stringify(result.body));
    return result;
  }
}

const ctx = { request_id: crypto.randomUUID(), start_time: Date.now() };
const builder = new BaR(new NodeDispatcher(res), {}, ctx);

builder.as.ok({ hello: 'world' }).build();
```

Without a dispatcher, `.build()` returns `BaRFinalResult` and does not write to the socket:

```typescript
const result = new BaR()
  .as.ok({ hello: 'world' })
  .build();

// result.body, result.statusCode, result.headers, result.cookies
```

---

## Custom adapter

Implement `IBaRDispatcher` and attach a `ResponseBuilder` per request.

### Step 1: Dispatcher

```typescript
import { IBaRDispatcher, BaRFinalResult } from '@vorlaxen-labs/bar-js';

class MyDispatcher implements IBaRDispatcher {
  constructor(
    private reply: {
      status(n: number): this;
      header(k: string, v: string): this;
      json(b: unknown): void;
    },
  ) {}

  dispatch(result: BaRFinalResult): BaRFinalResult {
    for (const [key, value] of Object.entries(result.headers)) {
      this.reply.header(key, String(value));
    }

    this.reply.status(result.statusCode).json(result.body);
    return result;
  }
}
```

### Step 2: Middleware or hook

```typescript
import { BaR } from '@vorlaxen-labs/bar-js';

app.use((req, res, next) => {
  const ctx = {
    request_id: crypto.randomUUID(),
    start_time: Date.now(),
  };

  req.bar = { ctx };
  res.builder = new BaR(new MyDispatcher(res), { logger: console }, ctx);
  next();
});
```

For Express, prefer `BarExpressAdapter` — it already handles context, default headers, cookies, no-body statuses, and hook wiring.

---

## Integration options

| Approach | Context | Builder | Dispatch |
|----------|---------|---------|----------|
| `BarExpressAdapter` | `req.bar.ctx` | `res.builder` | `ExpressDispatcher` |
| `BarFastifyPlugin` / `registerBarFastify` | `request.bar.ctx` | `reply.builder` | `FastifyDispatcher` |
| Custom middleware | You define | `new BaR(dispatcher, options, ctx)` | Your `IBaRDispatcher` |
| No dispatcher | Optional `ctx` | `new BaR()` | Returns `BaRFinalResult` only |

---

## When to write a custom adapter

- Frameworks other than Express or Fastify (Hono, Koa, etc.)
- Serverless or edge handlers with a custom `reply` object
- Different cookie or header semantics than the built-in dispatchers

For Fastify, prefer `BarFastifyPlugin` or `registerBarFastify` — same options and lifecycle as Express.

---

## Next steps

- [Advanced chaining](./advanced-chaining.md) — headers, cookies, hooks, `wrap()`
- [API reference](./api-reference.md) — `IBaRDispatcher`, hook events, response schema
