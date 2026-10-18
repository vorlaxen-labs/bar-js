# Getting started

**BaR (Build a Response)** standardizes JSON API responses in TypeScript. This guide covers installation, package exports, migration from 2.x, a minimal Express setup, your first responses, request context, and TypeScript.

## Installation

BaR works with common package managers:

```bash
npm install @vorlaxen-labs/bar-js
```

```bash
pnpm add @vorlaxen-labs/bar-js
```

```bash
yarn add @vorlaxen-labs/bar-js
```

The published package has **zero runtime dependencies**. Install framework peers in your app when you use an adapter:

| Adapter | Install in your app |
|---------|---------------------|
| Express | `express` |
| Fastify | `fastify` and `@fastify/cookie` |

See [Adapters](./adapters.md) for Fastify cookie ordering and full option lists.

## Package exports

| Import | Purpose |
|--------|---------|
| `@vorlaxen-labs/bar-js` | Core: `ResponseBuilder`, `BaR`, `BaRHooks`, constants, `IBaRDispatcher` |
| `@vorlaxen-labs/bar-js/adapters/express` | `BarExpressAdapter`, Express type augmentation |
| `@vorlaxen-labs/bar-js/adapters/fastify` | `BarFastifyPlugin`, `registerBarFastify`, Fastify type augmentation |

Import the adapter path once (side effect) so `req.bar` / `res.builder` (or Fastify equivalents) are typed:

```typescript
import '@vorlaxen-labs/bar-js/adapters/express';
```

## Adapter imports

Adapter entry points live under subpaths (not the root package):

```diff
- import { BarExpressAdapter } from '@vorlaxen-labs/bar-js';
- import '@vorlaxen-labs/bar-js';
+ import { BarExpressAdapter } from '@vorlaxen-labs/bar-js/adapters/express';
+ import '@vorlaxen-labs/bar-js/adapters/express';
```

Fastify users should import from `@vorlaxen-labs/bar-js/adapters/fastify` instead of the root package.

## Basic Express setup

`BarExpressAdapter` registers middleware that creates **`req.bar.ctx`** and attaches **`res.builder`** on every request.

```typescript
import express, { Request, Response } from 'express';
import '@vorlaxen-labs/bar-js/adapters/express';
import { BarExpressAdapter } from '@vorlaxen-labs/bar-js/adapters/express';

const app = express();
app.use(express.json());

const bar = new BarExpressAdapter({
  withDefaultHeaders: true,
  logger: console,
});

app.use(bar.handler());
```

> **Tip:** Register `bar.handler()` **early** in the middleware stack so routes and error handlers can use `res.builder` and `req.bar.ctx`.

### Log or trace with request context

Any middleware or route that runs **after** BaR can read context:

```typescript
app.use((req: Request, _res: Response, next) => {
  console.log('Request ID:', req.bar.ctx.request_id);
  console.log('Started at:', req.bar.ctx.start_time);
  next();
});
```

## Your first responses

### Success

Use semantic `.as` presets instead of hand-rolling status codes and JSON shapes:

```typescript
app.get('/api/ping', (req: Request, res: Response) => {
  return res.builder
    .as.ok({ status: 'alive' }, 'Server is up and running!')
    .build();
});
```

Example body (see [API reference](./api-reference.md) for the full schema):

```json
{
  "success": true,
  "timestamp": "2026-05-04T13:52:00.000Z",
  "message": "Server is up and running!",
  "data": { "status": "alive" },
  "metadata": {
    "status_code": 200,
    "request_id": "fddc7272-4405-4001-9858-ab40007bfa11",
    "server_time": "2026-05-04T13:52:00.000Z"
  }
}
```

### Created

```typescript
app.post('/api/users', async (req: Request, res: Response) => {
  const user = await userService.create(req.body);

  return res.builder
    .as.created({ id: user.id, name: user.name }, 'User created successfully')
    .build();
});
```

### Client error

```typescript
app.post('/api/secure-data', (req: Request, res: Response) => {
  const isAuth = false;

  if (!isAuth) {
    return res.builder
      .as.unauthorized('Invalid or missing credentials.')
      .build();
  }
});
```

Error responses set `success: false` and `data: null`. The preset table and default messages are listed in [API reference](./api-reference.md#semantic-presets-as).

## Context and tracing

Each request gets `request_id` and `start_time` on **`req.bar.ctx`**. The same `request_id` is merged into `metadata.request_id` on every built response.

```typescript
app.get('/debug', (req: Request, res: Response) => {
  const { request_id, start_time } = req.bar.ctx;

  return res.builder
    .as.ok(
      {
        message: 'Check your logs with this ID',
        request_id,
        elapsed_ms: Date.now() - start_time,
      },
      'Trace info',
    )
    .build();
});
```

Incoming correlation headers (`x-request-id`, `x-correlation-id`, `traceparent`) can seed `request_id`; see [Adapters](./adapters.md#configuration).

## TypeScript

BaR ships Express augmentations when you import the adapter package. Ensure `"moduleResolution": "bundler"` or `"node16"` (or newer) in `tsconfig.json`.

If types do not appear, add a local shim:

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

## Fastify (at a glance)

Register `@fastify/cookie` before BaR, then use `reply.builder`:

```typescript
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import '@vorlaxen-labs/bar-js/adapters/fastify';
import { registerBarFastify } from '@vorlaxen-labs/bar-js/adapters/fastify';

const app = Fastify();

await app.register(cookie);
registerBarFastify(app, { withDefaultHeaders: true, logger: console });

app.get('/api/test', async (_request, reply) => {
  return reply.builder.as.ok({ hello: 'world' }).build();
});
```

Full Fastify notes: [Adapters](./adapters.md#fastify-adapter).

## Next steps

- [Adapters](./adapters.md) — Express and Fastify options, vanilla Node, custom dispatchers
- [Advanced chaining](./advanced-chaining.md) — headers, cookies, `wrap()`, hooks, pagination
- [API reference](./api-reference.md) — presets, builder methods, response schema
