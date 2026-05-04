# 🥂 BaR (Builder and Response)

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/@vorlaxen-labs/bar-js)
[![License: MIT License](https://img.shields.io/badge/License-mit-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)

**Design your API responses like a pro, serve them like a bartender.**

`BaR` is a framework-agnostic, lightweight TypeScript response builder. It eliminates JSON clutter and ensures every API response follows a consistent, production-ready schema with built-in traceability and security.

---

## ✨ Features

*   🚀 **Framework Agnostic:** Seamlessly integrates with Express, Fastify, or Vanilla Node.js.
*   🔗 **Fluent Interface:** Build responses with an intuitive, chainable syntax.
*   🛠️ **Adapter Strategy:** A single `.build()` call handles headers and framework-specific dispatching logic.
*   🛡️ **Secure & Standardized:** Automatic security headers, request tracking (`request_id`), and ISO timestamps.
*   📐 **Fully Type-Safe:** Built with strict TypeScript for excellent IntelliSense and runtime reliability.

---

## 📦 Installation
```bash
npm install @vorlaxen-labs/bar-js
```

---

## 🔌 Express.js Integration

`BaR` uses a **Dispatcher Pattern**. The adapter injects `res.builder` and `res.bar` objects directly into the Express response cycle.

```typescript
import express, { Request, Response } from 'express';
import { BarExpressAdapter } from "@vorlaxen-labs/bar-js";

const app = express();
app.use(express.json());

// 1. Configure the Adapter
const bar = new BarExpressAdapter({
    withDefaultHeaders: true,
    logger: console
});

// 2. Register as Middleware
app.use(bar.handler());

// 3. Access Context (e.g., in a logger or custom middleware)
app.use((req: Request, res: Response, next) => {
    // Access request_id or metadata via res.bar.ctx
    console.log('Request Tracing ID:', res.bar.ctx.request_id);
    next(); 
});

// 4. Constructing Responses
app.get('/api/test', (req: Request, res: Response) => {
    return res.builder
        .as.ok({ hello: 'world' }, 'Operation successful')
        .build();
});
```

---

## 🍹 Usage Guide

### 1. Semantic Presets (`.as`)
Stop memorizing HTTP status codes. Use semantic aliases for common scenarios:
```typescript
res.builder.as.ok(data, "Success!");       // 200 OK
res.builder.as.created(newItem);            // 201 Created
res.builder.as.unauthorized("Access denied");// 401 Unauthorized
res.builder.as.notFound("User not found");  // 404 Not Found
```

### 2. Advanced Chaining
For complete control over the response structure:
```typescript
return res.builder
  .status(202)
  .data({ taskId: 'abc-123' })
  .message("Task queued successfully")
  .header('X-Custom-Header', 'BaR-Rocks')
  .setMeta({ cluster: 'us-east-1' })
  .build(); 
```

---

## 📐 Standard Response Schema

Every response served by **BaR** follows this predictable, front-end friendly structure:
```json
{
  "success": true,
  "timestamp": "2026-05-04T13:52:00.000Z",
  "message": "Operation successful",
  "data": {
    "hello": "world"
  },
  "metadata": {
    "status_code": 200,
    "request_id": "fddc7272-4405-4001-9858-ab40007bfa11",
    "server_time": "2026-05-04T13:52:00.000Z"
  }
}
```

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

> **"Your code is a work of art, and your responses are its signature; the clearer the signature, the more valuable the work."** 🥂