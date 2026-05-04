# 🥂 BaR (Builder and Response)

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/@vorlaxen/bar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)

**Design your API responses like a pro, serve them like a bartender.**

`BaR` is a framework-agnostic, lightweight TypeScript response builder. It eliminates JSON clutter and ensures every API response follows a consistent, production-ready schema with built-in traceability and security.

---

## ✨ Features

*   🚀 **Framework Agnostic:** Seamlessly integrates with Express, Fastify, Koa, or Vanilla Node.js.
*   🔗 **Fluent Interface:** Build responses with an intuitive, chainable syntax.
*   🛠️ **Dispatcher Strategy:** One `.build()` call to rule them all—automatically handles headers and framework-specific sending logic.
*   🛡️ **Secure & Standardized:** Automatic security headers, request tracking (`request_id`), and ISO timestamps.
*   📐 **Type-Safe:** Built with strict TypeScript for excellent IntelliSense and runtime reliability.

---

## 📦 Installation
```bash
npm install @vorlaxen/bar-js
```

---

## 🔌 Framework Integration

`BaR` uses a **Dispatcher Pattern**. The builder creates the response, and the Dispatcher handles the delivery through your framework of choice.

### Express.js
```typescript
import express from 'express';
import { barExpress } from '@vorlaxen/bar/adapters';

const app = express();

// Injects 'res.builder' into the response object
app.use(barExpress);

app.get('/api/user', (req, res) => {
  return res.builder.as.ok({ name: 'Vorlaxen' }).build();
});
```

### Fastify
```typescript
import Fastify from 'fastify';
import { barFastify } from '@vorlaxen/bar/adapters';

const fastify = Fastify();

// Registers 'reply.builder'
fastify.register(barFastify);

fastify.get('/api/user', async (request, reply) => {
  return reply.builder.as.ok({ name: 'Vorlaxen' }).build();
});
```

---

## 🍹 Usage Guide

### 1. Semantic Presets (`.as`)
Stop memorizing status codes. Use semantic aliases for common scenarios:
```typescript
// 200 OK
res.builder.as.ok(data, "Success!");

// 201 Created
res.builder.as.created(newItem);

// 401 Unauthorized
res.builder.as.unauthorized("Invalid credentials");

// 404 Not Found
res.builder.as.notFound("User not found");
```

### 2. The Auto-Dispatching `.build()`
When using an adapter (Express/Fastify), calling `.build()` finalized the metadata and **automatically sends** the response.
```typescript
return res.builder
  .status(202)
  .data({ taskId: 'abc-123' })
  .message("Processing started")
  .header('X-Process-Queue', 'High')
  .setMeta({ cluster: 'us-east-1' })
  .build(); // Automatically executes res.status().json() or reply.send()
```

---

## 📐 Standard Schema

Every response served by **BaR** follows this predictable structure:
```json
{
  "success": true,
  "timestamp": "2026-05-04T13:52:00.000Z",
  "message": "Resource retrieved successfully",
  "data": {
    "id": 1,
    "username": "vorlaxen"
  },
  "metadata": {
    "status_code": 200,
    "request_id": "req-98234-jsl",
    "server_time": "2026-05-04T13:52:00.000Z"
  }
}
```

---

## 🛠️ Advanced: Custom Dispatchers

If you are using a custom framework or want to modify how responses are sent, implement the `IBaRDispatcher` interface:
```typescript
import { IBaRDispatcher, BaRFinalResult } from '@vorlaxen/bar';

class MyCoolDispatcher implements IBaRDispatcher {
  constructor(private myResponseObj: any) {}

  dispatch(result: BaRFinalResult) {
    // Implement your own sending logic here
    this.myResponseObj.setHeaders(result.headers);
    return this.myResponseObj.send(result.statusCode, result.body);
  }
}

// Manual usage
const builder = new ResponseBuilder(new MyCoolDispatcher(customRes));
```

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

> **"Your code is a work of art, and your responses are its signature; the clearer the signature, the more valuable the work."** 🥂