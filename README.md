# BaR — TypeScript API response builder for Express and Fastify

[![npm version](https://img.shields.io/npm/v/@vorlaxen-labs/bar-js)](https://www.npmjs.com/package/@vorlaxen-labs/bar-js)
[![CI](https://img.shields.io/github/actions/workflow/status/vorlaxen-labs/bar-js/ci.yml?branch=main&label=CI)](https://github.com/vorlaxen-labs/bar-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue?logo=typescript)](https://www.typescriptlang.org/)
[![OpenSSF Baseline Level 1](https://www.bestpractices.dev/projects/16101/baseline)](https://www.bestpractices.dev/en/projects/16101/baseline-1)
[![XERJ Corpus Hub contributor](https://hub.xerj.org/contributors/vorlaxen/badge.svg)](https://hub.xerj.org/contributors/vorlaxen)

**BaR** (**Build a Response**) is a framework-agnostic TypeScript library for Node.js APIs. It gives you a fluent `ResponseBuilder`, a consistent JSON response envelope, and optional adapters for **Express** and **Fastify**. You chain status, message, data, headers, and cookies, then call `.build()` once. An **adapter** attaches the builder to your framework; a **dispatcher** sends the finished response over HTTP.

## Table of contents

- [When to use BaR](#when-to-use-bar)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Features](#features)
- [Standard response envelope](#standard-response-envelope)
- [Package exports](#package-exports)
- [Usage](#usage)
- [Documentation](#documentation)
- [Security](#security)
- [Contributing](#contributing)
- [For maintainers](#for-maintainers)
- [License](#license)

## When to use BaR

- You want every REST endpoint to return the same JSON shape (`success`, `data`, `message`, `metadata`).
- You need **request IDs** and timestamps in responses for logging and support.
- You use **Express** or **Fastify** and prefer `res.builder` / `reply.builder` over ad-hoc `res.json()`.
- You may switch frameworks later: the core builder and **dispatcher** pattern stay the same.
- You care about **zero runtime dependencies** in the published package; framework libraries are optional peers in your app.

## Installation

```bash
npm install @vorlaxen-labs/bar-js
```

Install peers only for the adapters you use:

| Adapter | In your app                           |
| ------- | ------------------------------------- |
| Express | `npm install express`                 |
| Fastify | `npm install fastify @fastify/cookie` |

Details: [docs/adapters.md](docs/adapters.md).

## Quick start

### Express adapter

```typescript
import express, { Request, Response } from "express";
import "@vorlaxen-labs/bar-js/adapters/express"; // side-effect: types for req.bar / res.builder
import { BarExpressAdapter } from "@vorlaxen-labs/bar-js/adapters/express";

const app = express();
app.use(express.json());

app.use(
  new BarExpressAdapter({
    withDefaultHeaders: true,
    logger: console,
  }).handler(),
);

app.get("/api/test", (_req: Request, res: Response) => {
  return res.builder.as.ok({ hello: "world" }, "Operation successful").build();
});
```

The adapter import is a TypeScript **side effect**: it loads the Express augmentation so `res.builder` and `req.bar.ctx` (including `req.bar.ctx.request_id`) are typed. The Fastify subpath does the same for `reply.builder` and `request.bar`.

### Fastify plugin

Register `@fastify/cookie` before BaR so cookie dispatch works.

```typescript
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import "@vorlaxen-labs/bar-js/adapters/fastify"; // side-effect: types for request.bar / reply.builder
import { registerBarFastify } from "@vorlaxen-labs/bar-js/adapters/fastify";

const app = Fastify();

await app.register(cookie);
registerBarFastify(app, { withDefaultHeaders: true, logger: console });

app.get("/api/test", async (_request, reply) => {
  reply.builder.as.ok({ hello: "world" }).build();
  return reply;
});
```

`.build()` is **synchronous** and returns `BaRFinalResult` — not `reply` and not a Promise. The Fastify dispatcher already calls `reply.send()` inside `.build()`. In an `async` handler, `return reply` afterward so Fastify does not treat that result object as a second payload.

### After `.build()`

The adapter runs **before** your route (it attaches context and the builder). `.build()` then hands the envelope to the dispatcher, which writes HTTP:

```text
request → adapter middleware (ctx + builder)
        → your route
        → res.builder / reply.builder … .build()
        → dispatcher (status, headers, cookies, JSON)
        → HTTP
```

## Features

- **Zero runtime dependencies** — Express, Fastify, and `@fastify/cookie` are optional peers.
- **Fluent API** — Chain `.status()`, `.data()`, `.message()`, headers, cookies, then `.build()`.
- **Semantic presets** — `.as.ok()`, `.as.created()`, `.as.notFound()`, and more instead of raw status codes.
- **Adapters and dispatchers** — One `.build()` assembles the body; the dispatcher sets status, headers, and JSON.
- **Traceability** — `request_id`, ISO timestamps, and optional incoming correlation headers.
- **Security defaults** — Optional security and cache headers via adapter options.
- **TypeScript-first** — Strict types and framework augmentations when you import adapter subpaths.

## Standard response envelope

Every built response follows this shape (frontend-friendly and predictable):

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

Error responses use a structured `error` object (no top-level `message`):

```json
{
  "success": false,
  "timestamp": "2026-05-04T13:52:00.000Z",
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "email is required"
  },
  "metadata": {
    "status_code": 400,
    "request_id": "fddc7272-4405-4001-9858-ab40007bfa11",
    "server_time": "2026-05-04T13:52:00.000Z"
  }
}
```

Full schema: [docs/api-reference.md](docs/api-reference.md).

## Package exports

| Import                                   | Purpose                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `@vorlaxen-labs/bar-js`                  | Core: `ResponseBuilder`, `BaR`, hooks, constants, `IBaRDispatcher` |
| `@vorlaxen-labs/bar-js/adapters/express` | `BarExpressAdapter`, Express type augmentation                     |
| `@vorlaxen-labs/bar-js/adapters/fastify` | `registerBarFastify`, Fastify type augmentation                    |

### Highlights

- Failures expose `error: { code, message, details? }` instead of a top-level `message`.
- Pagination: `.paginate(data, { strategy: 'offset' | 'cursor', ... })`.
- Validation: `.as.validationError(errors)` and `normalizeValidationErrors()`.
- Adapters: `@vorlaxen-labs/bar-js/adapters/express` and `/adapters/fastify`.

## Usage

### Semantic presets (`.as`)

```typescript
res.builder.as.ok(data, "Success"); // 200
res.builder.as.created(newItem); // 201
res.builder.as.badRequest("email is required"); // 400
res.builder.as.unauthorized("Access denied"); // 401
res.builder.as.notFound("User not found"); // 404
```

### Errors

```typescript
app.post("/api/users", (req: Request, res: Response) => {
  if (!req.body?.email) {
    return res.builder.as.badRequest("email is required").build();
  }

  try {
    const user = { id: "u_1", email: req.body.email };
    return res.builder.as.created(user, "User created").build();
  } catch {
    return res.builder.as.internalServerError().build();
  }
});
```

For rejected promises, `await res.builder.wrap(promise)` then `.build()` — see [advanced chaining](docs/advanced-chaining.md).

### Advanced chaining

```typescript
return res.builder
  .status(202)
  .data({ taskId: "abc-123" })
  .message("Task queued successfully")
  .header("X-Custom-Header", "BaR")
  .setMeta({ cluster: "us-east-1" })
  .build();
```

More examples: [docs/advanced-chaining.md](docs/advanced-chaining.md).

## Documentation

Guides live in **[docs/](docs/README.md)**:

| Guide                                          | Description                                        |
| ---------------------------------------------- | -------------------------------------------------- |
| [Getting started](docs/getting-started.md)     | Install, exports, migration, first routes          |
| [Adapters](docs/adapters.md)                   | Express, Fastify, vanilla Node, custom dispatchers |
| [Advanced chaining](docs/advanced-chaining.md) | Headers, cookies, `wrap()`, hooks, pagination      |
| [API reference](docs/api-reference.md)         | Presets, builder methods, response schema          |

- npm: [`@vorlaxen-labs/bar-js`](https://www.npmjs.com/package/@vorlaxen-labs/bar-js)
- Repository: [github.com/vorlaxen-labs/bar-js](https://github.com/vorlaxen-labs/bar-js)
- OpenSSF Baseline Level 1: [project 16101](https://www.bestpractices.dev/en/projects/16101/baseline-1) (criteria v2026.08.28)
- Corpus Hub: [vorlaxen-labs--bar-js](https://hub.xerj.org/corpus/vorlaxen-labs--bar-js)
- Security reports: [SECURITY.md](SECURITY.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)

## Security

Report vulnerabilities in private. See [SECURITY.md](SECURITY.md). Do not open a public issue for a security problem.

Default response headers, cookie flags, and production error masking are described in that file and in [docs/adapters.md](docs/adapters.md).

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Questions that are not bugs go through the [issue templates](https://github.com/vorlaxen-labs/bar-js/issues/new/choose).

## For maintainers

Automated npm publish from `main` is described in [docs/PUBLISHING.md](docs/PUBLISHING.md) (GitHub `NPM_TOKEN` secret; no `.env` required in CI).

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
