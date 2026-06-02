# 🚀 Getting Started

**BaR (Builder a Response)** streamlines your API response logic in minutes. This guide covers installation, Express setup, and your first standardized response.


## 📦 Installation

BaR works with all major package managers:

::: code-group
```bash [pnpm]
pnpm add @vorlaxen-labs/bar-js
```

```bash [npm]
npm install @vorlaxen-labs/bar-js
```

```bash [yarn]
yarn add @vorlaxen-labs/bar-js
```
:::

Express is a peer dependency — install it if it is not already in your project:

```bash
npm install express
```

---

## 🛠️ Basic Setup

BaR integrates with Express through `BarExpressAdapter`. The adapter registers middleware that injects **`req.bar.ctx`** (request context) and **`res.builder`** (response builder).

### 1. Initialize the Adapter

Register BaR in your main application file (e.g. `app.ts` or `server.ts`):

```typescript
import express, { Request, Response } from 'express';
import { BarExpressAdapter } from '@vorlaxen-labs/bar-js';

const app = express();
app.use(express.json());

const bar = new BarExpressAdapter({
  // Default: true — security headers are applied unless you pass false
  withDefaultHeaders: true,
  logger: console, // optional: info / warn / error / debug
});

app.use(bar.handler());
```

::: tip PRO TIP
Place `bar.handler()` **early** in your middleware stack so every route and error handler can use `res.builder` and `req.bar.ctx`.
:::

### 2. Log or trace with request context

Use `req.bar.ctx` in any middleware or route that runs **after** the BaR middleware:

```typescript
app.use((req: Request, _res: Response, next) => {
  console.log('Request ID:', req.bar.ctx.request_id);
  console.log('Started at:', req.bar.ctx.start_time);
  next();
});
```

---

## 🍹 Your First Response

Once the middleware is active, `res.builder` is available on every response.

### Send a success response

Use semantic `.as` presets instead of manual status codes and JSON shapes:

```typescript
app.get('/api/ping', (req: Request, res: Response) => {
  return res.builder
    .as.ok({ status: 'alive' }, 'Server is up and running!')
    .build();
});
```

**Response:**

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

### Send a created response

```typescript
app.post('/api/users', async (req: Request, res: Response) => {
  const user = await userService.create(req.body);

  return res.builder
    .as.created({ id: user.id, name: user.name }, 'User created successfully')
    .build();
});
```

### Handle errors gracefully

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

**Error response:**

```json
{
  "success": false,
  "timestamp": "2026-05-04T13:52:00.000Z",
  "message": "Invalid or missing credentials.",
  "data": null,
  "metadata": {
    "status_code": 401,
    "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "server_time": "2026-05-04T13:52:00.000Z"
  }
}
```

---

## 🔍 Context & Tracing

Every request gets a unique `request_id` and `start_time` on **`req.bar.ctx`**:

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

The same `request_id` is also written into `metadata.request_id` on every built response, so clients and server logs stay aligned.

---

## ⚡ TypeScript

BaR ships Express type augmentation when you import the package — `req.bar` and `res.builder` are typed out of the box:

```typescript
import '@vorlaxen-labs/bar-js';
import express, { Request, Response } from 'express';
```

If types do not appear in your editor, ensure `"moduleResolution": "bundler"` or `"node16"` (or newer) in `tsconfig.json`, or add a local shim:

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

## 💡 Next Steps

- **[Advanced Chaining](./advanced-chaining)**: Headers, cookies, `wrap()`, hooks, pagination, and more.
- **[Adapters](./adapters)**: Express adapter options, vanilla usage, and custom dispatchers.
