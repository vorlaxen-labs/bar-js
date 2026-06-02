---
outline: deep
---

# 🥂 BaR (Builder a Response)

<div style="display: flex; gap: 8px; margin-top: 10px; margin-bottom: 20px;">
  <a href="https://www.npmjs.com/package/@vorlaxen-labs/bar-js"><img src="https://img.shields.io/badge/npm-v2.0.0-blue.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-mit-blue.svg" alt="License"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript" alt="TypeScript"></a>
</div>

**Design your API responses like a pro, serve them like a bartender.**

`BaR` is a lightweight TypeScript response builder for Node.js. It produces a consistent JSON schema on every response, with traceability (`request_id`), optional security headers, and a fluent chain ending in a single `.build()`.

## Features

- **Express-first, adapter-ready:** `BarExpressAdapter` wires BaR into Express middleware; other stacks use a custom dispatcher.
- **Fluent interface:** Chain `.status()`, `.data()`, `.setHeaders()`, `.setCookies()`, then `.build()`.
- **Dispatcher pattern:** `.build()` assembles the payload and hands it to `ExpressDispatcher`, which sets headers, cookies, status, and JSON body.
- **Secure defaults:** Security and cache headers are applied by default (`withDefaultHeaders` is opt-out).
- **Request context:** `req.bar.ctx` exposes `request_id` and `start_time` per request.
- **Fully typed:** `ResponseBuilder` (exported as `BaR`) with strict metadata and preset types.
- **Lifecycle hooks:** `before_build`, `after_build`, `before_dispatch`, `after_dispatch`.
- **Async helper:** `wrap()` resolves promises into `.data()` or maps rejections to `500`.
- **Cookie queue:** `setCookies()` for single or batch cookies on dispatch.

---

## 🔌 Express at a glance

```typescript
import express, { Request, Response } from 'express';
import { BarExpressAdapter } from '@vorlaxen-labs/bar-js';

const app = express();
app.use(express.json());

app.use(new BarExpressAdapter().handler());

app.get('/api/test', (req: Request, res: Response) => {
  console.log(req.bar.ctx.request_id);

  return res.builder
    .as.ok({ hello: 'world' }, 'Operation successful')
    .build();
});
```

---

## 📐 Standard response schema

Every response follows the same shape:

```json
{
  "success": true,
  "timestamp": "2026-05-04T13:52:00.000Z",
  "message": "Operation successful",
  "data": { "hello": "world" },
  "metadata": {
    "status_code": 200,
    "request_id": "fddc7272-4405-4001-9858-ab40007bfa11",
    "server_time": "2026-05-04T13:52:00.000Z"
  }
}
```

**Fields:**

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | `true` for status `200–399` unless overridden with `forceSuccess()`. Error presets call `forceSuccess(false)`. |
| `timestamp` | `string` | ISO 8601 time set at build time. |
| `message` | `string` | Human-readable outcome; defaults to `"Operation successful"` or `"Operation failed"`. |
| `data` | `T \| null` | Payload; `null` on errors and `noContent`. |
| `metadata` | `object` | Always includes `request_id`, `server_time`, `status_code`; extend with `setMeta()` / `paginate()`. |

---

## 🎯 Preset methods (`.as.*`)

Semantic aliases map to HTTP status codes:

| Method | Status | `success` |
|---|---|---|
| `.as.ok(data?, message?)` | `200` | `true` |
| `.as.created(data?, message?)` | `201` | `true` |
| `.as.accepted(message?)` | `202` | `true` |
| `.as.noContent()` | `204` | `true` |
| `.as.badRequest(message?)` | `400` | `false` |
| `.as.unauthorized(message?)` | `401` | `false` |
| `.as.forbidden(message?)` | `403` | `false` |
| `.as.notFound(message?)` | `404` | `false` |
| `.as.conflict(message?)` | `409` | `false` |
| `.as.unprocessable(message?)` | `422` | `false` |
| `.as.tooManyRequests(message?)` | `429` | `false` |
| `.as.internalServerError(message?)` | `500` | `false` |
| `.as.serviceUnavailable(message?)` | `503` | `false` |
| `.as.gatewayTimeout(message?)` | `504` | `false` |

All `.as.*` methods return the same `ResponseBuilder`, so you can keep chaining `.setHeaders()`, `.setCookies()`, `.setMeta()`, etc.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

::: info
**"Your code is a work of art, and your responses are its signature; the clearer the signature, the more valuable the work."** 🥂
:::
