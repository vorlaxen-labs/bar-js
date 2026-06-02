# 🔌 Adapters

BaR separates **building** a response from **delivering** it.

1. **`ResponseBuilder`** (`BaR`) — assembles `body`, `statusCode`, `headers`, and `cookies`.
2. **`IBaRDispatcher`** — sends that result through your HTTP stack.
3. **`BarExpressAdapter`** — Express middleware that creates context, applies default headers, and attaches `res.builder`.

> **BaR builds the response; the dispatcher delivers it.**

---

## 🚂 Express adapter (`BarExpressAdapter`)

### Setup

```typescript
import express, { Request, Response } from 'express';
import { BarExpressAdapter } from '@vorlaxen-labs/bar-js';

const app = express();
app.use(express.json());

const bar = new BarExpressAdapter({
  withDefaultHeaders: true, // default: true (pass false to disable)
  logger: console,
  hooks: myHooks,              // optional BaRHooks instance
  defaultHeaders: {            // optional override of DEFAULT_SECURITY_HEADERS
    'X-API-Version': '1',
  },
});

app.use(bar.handler());
```

### Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `withDefaultHeaders` | `boolean` | `true` | When not `false`, sets security/cache headers on `res` before `next()`. |
| `defaultHeaders` | `Record<string, string>` | `DEFAULT_SECURITY_HEADERS` | Header map used when `withDefaultHeaders` is enabled. |
| `logger` | `Logger` | `undefined` | Optional logger (`info`, `warn`, `error`, `debug?`). |
| `hooks` | `BaRHooks` | `undefined` | Lifecycle hooks shared by every `res.builder` on that app. |
| `environment` | `'development' \| 'production' \| 'test'` | `undefined` | When `'production'`, `wrap()` hides internal error messages from clients. |
| `requestIdHeaders` | `readonly string[]` | `x-request-id`, `x-correlation-id`, `traceparent` | Incoming headers used to populate `req.bar.ctx.request_id`. |

### What the middleware injects

| Property | Location | Description |
|---|---|---|
| `ctx` | `req.bar.ctx` | `request_id` (UUID), `start_time` (ms). |
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
   - Sets cookies via `res.cookie()`
   - `res.status(statusCode).json(result.body)` — or `res.end()` for `204` / `205` / `304` (no body)
3. Hooks: `before_dispatch` → `after_dispatch`

If headers were already sent, dispatch is skipped and a warning is logged.

---

## ⚡ TypeScript (Express)

Importing the package registers Express augmentations:

```typescript
import '@vorlaxen-labs/bar-js';
```

- `req.bar.ctx` → `BaRContext`
- `res.builder` → `ResponseBuilder`

Manual augmentation (if needed):

```typescript
// types/express-bar.d.ts
import type { ResponseBuilder } from '@vorlaxen-labs/bar-js';

declare global {
  namespace Express {
    interface Request {
      bar: {
        ctx: {
          request_id: string;
          start_time: number;
        };
      };
    }
    interface Response {
      builder: ResponseBuilder;
    }
  }
}
```

---

## 🧩 Vanilla Node.js (no adapter)

Use `BaR` (alias of `ResponseBuilder`) with your own dispatcher, or without one to only get the result object:

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

// Inside your HTTP server handler:
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

## 🛠️ Custom adapter

Implement `IBaRDispatcher` and attach a `ResponseBuilder` per request.

### Step 1: Dispatcher

```typescript
import { IBaRDispatcher, BaRFinalResult } from '@vorlaxen-labs/bar-js';

class MyDispatcher implements IBaRDispatcher {
  constructor(private reply: { status(n: number): this; header(k: string, v: string): this; json(b: unknown): void }) {}

  dispatch(result: BaRFinalResult): BaRFinalResult {
    for (const [key, value] of Object.entries(result.headers)) {
      this.reply.header(key, String(value));
    }

    this.reply.status(result.statusCode).json(result.body);
    return result;
  }
}
```

### Step 2: Middleware / hook

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

For Express, prefer `BarExpressAdapter` — it already handles context, default headers, cookies, and hook wiring.

---

## 📊 Integration options

| Approach | Context | Builder | Dispatch |
|---|---|---|---|
| `BarExpressAdapter` | `req.bar.ctx` | `res.builder` | `ExpressDispatcher` |
| Custom middleware | You define `req.bar` | `new BaR(dispatcher, options, ctx)` | Your `IBaRDispatcher` |
| No dispatcher | Optional `ctx` | `new BaR()` | Returns `BaRFinalResult` only |

---

## 🧭 When to write a custom adapter

- Non-Express framework (Fastify, Hono, Koa, etc.)
- Serverless or edge handlers with a custom `reply` object
- You need different cookie/header semantics than `ExpressDispatcher`

There is no built-in Fastify plugin yet — the same `ResponseBuilder` + `IBaRDispatcher` pattern applies.

---

## 🥂 Final note

Adapters are a thin integration layer. The response schema, presets, hooks, and chaining API stay the same everywhere; only dispatch changes.
