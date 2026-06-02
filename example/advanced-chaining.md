# 🧬 Advanced Chaining

BaR gives you fine-grained control over status, headers, cookies, metadata, and async data — while keeping a single `.build()` dispatch at the end.

In this guide:

- Custom status codes and `forceSuccess()`
- Headers and cookies
- `setMeta()`, `paginate()`, `withMetadata()`
- `wrap()`, `transform()`, `when()`
- Lifecycle hooks on the Express adapter

---

## 🧠 Chaining fundamentals

Every method returns the same builder instance:

```typescript
return res.builder
  .as.ok(data)
  .setHeaders('X-Custom', 'value')
  .build();
```

---

## 🔢 Custom status codes

### Override after a preset

```typescript
return res.builder
  .as.ok({ task: 'queued' })
  .status(202)
  .message('Task queued successfully')
  .build();
```

`.status()` resets any previous `forceSuccess()` override.

### Build without a preset

```typescript
return res.builder
  .status(200)
  .message('Custom message')
  .data({ custom: true })
  .build();
```

---

## 🏳️ Overriding the `success` flag

By default, `success` is `true` when `200 <= status < 400`.

```typescript
// 200 but success: false
return res.builder
  .status(200)
  .forceSuccess(false)
  .message('Validation passed but no action taken')
  .data(null)
  .build();
```

Error presets (`.as.unauthorized()`, etc.) already call `forceSuccess(false)`.

---

## 🧾 Headers

### Single header

```typescript
return res.builder
  .as.ok({ success: true })
  .setHeaders('X-RateLimit-Remaining', '42')
  .setHeaders('X-App-Version', '1.3.0')
  .build();
```

### Multiple headers

```typescript
return res.builder
  .as.ok(data)
  .setHeaders({
    'X-Service': 'auth',
    'X-Env': 'production',
  })
  .build();
```

Adapter-level headers (`withDefaultHeaders`) are set on the raw Express `res` before your route runs. Builder headers are merged at dispatch time and can override defaults when keys collide.

---

## 🍪 Cookies

### Single cookie (with options)

```typescript
return res.builder
  .as.ok({ loggedIn: true })
  .setCookies('session', 'abc123', { httpOnly: true, secure: true })
  .build();
```

`ExpressDispatcher` calls `res.cookie()` for each queued cookie when `.build()` runs.

### Multiple cookies (object shorthand)

```typescript
return res.builder
  .as.ok(data)
  .setCookies({ theme: 'dark', lang: 'en' })
  .build();
```

For per-cookie options, use the three-argument form for each cookie.

---

## 🔐 Default security headers

When `withDefaultHeaders` is not `false`, the adapter applies `DEFAULT_SECURITY_HEADERS` (or your `defaultHeaders` override) on every request:

- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- `Content-Security-Policy`, `Cross-Origin-Opener-Policy`
- `Cache-Control`, `Pragma`, `X-DNS-Prefetch-Control`

```typescript
const bar = new BarExpressAdapter({
  withDefaultHeaders: true,
  defaultHeaders: {
    'X-API-Version': '1',
    'Cache-Control': 'no-store',
  },
});
```

---

## 📦 Metadata

### `setMeta()` — merge custom fields

```typescript
return res.builder
  .status(200)
  .message('Meta test')
  .data({ ok: true })
  .setMeta({ custom_field: 'custom_value', version: '1.0.0' })
  .build();
```

**Result:**

```json
{
  "metadata": {
    "status_code": 200,
    "request_id": "...",
    "server_time": "...",
    "custom_field": "custom_value",
    "version": "1.0.0"
  }
}
```

### `withMetadata()` — merge factory-generated fields

Use when you want `MetadataFactory` to fill standard fields explicitly in the chain:

```typescript
return res.builder
  .status(200)
  .withMetadata({ status_code: 200 })
  .build();
```

At `.build()` time, `request_id` from `req.bar.ctx` is always applied to the final metadata.

---

## 📄 Pagination

```typescript
return res.builder
  .as.ok(users)
  .paginate(100, 2, 20) // total, currentPage (1-based), limit
  .build();
```

**Metadata:**

```json
{
  "pagination": {
    "total": 100,
    "page": 2,
    "limit": 20,
    "total_pages": 5,
    "has_next": true
  }
}
```

---

## ⚙️ Async support with `wrap()`

`wrap()` is `async` — await it, then call `.build()`:

### Success

```typescript
app.get('/api/users/:id', async (req, res) => {
  await res.builder.wrap(userService.findById(req.params.id));
  return res.builder.build();
});
```

Resolved values become `.data()`; status stays whatever you set (default `200` from a prior preset or initial state).

### Rejection

```typescript
await res.builder.wrap(Promise.reject(new Error('DB Error')));
return res.builder.build();
// → 500, message: 'DB Error', success: false
```

---

## 🔄 `transform()`

Runs when `data` is not `null`; calls can be chained:

```typescript
return res.builder
  .data(10)
  .transform((n) => n * 2)
  .transform((n) => `Value: ${n}`)
  .build();
```

---

## ❓ `when()`

```typescript
return res.builder
  .as.ok(user)
  .when(isAdmin, (b) => b.setHeaders('X-Admin', 'true'))
  .when(isPaginated, (b) => b.paginate(total, page, limit))
  .build();
```

---

## 🪝 Lifecycle hooks

Hooks are configured on `BarExpressAdapter` (or on a standalone `ResponseBuilder` / `BaR` instance without Express).

### Express setup

```typescript
import { BaRHooks, BarExpressAdapter } from '@vorlaxen-labs/bar-js';

const hooks = new BaRHooks();

hooks.on('before_build', ({ statusCode }) => {
  console.log('Building', statusCode);
});

hooks.on('after_build', (result) => {
  console.log('Built', result.statusCode);
});

hooks.on('before_dispatch', (result) => {
  console.log('Dispatching', result.statusCode);
});

hooks.on('after_dispatch', (result) => {
  console.log('Dispatched', result.statusCode);
});

const bar = new BarExpressAdapter({ hooks, logger: console });
app.use(bar.handler());
```

### Hook events

| Event | When | Payload |
|---|---|---|
| `before_build` | Before body assembly | `{ statusCode }` |
| `after_build` | After body assembly | `BaRFinalResult` (cloned) |
| `before_dispatch` | Before `dispatcher.dispatch()` | `BaRFinalResult` (cloned) |
| `after_dispatch` | After dispatch | `BaRFinalResult` (cloned) |

`after_build` / dispatch hooks receive a **structured clone**. Mutating the clone does not change what was sent.

### Standalone builder (no Express)

```typescript
import { BaR, BaRHooks } from '@vorlaxen-labs/bar-js';

const hooks = new BaRHooks();
hooks.on('after_build', (result) => {
  console.log(result.body.success);
});

const result = new BaR(undefined, { hooks })
  .status(200)
  .data({ ok: true })
  .build();

// No dispatcher → result is returned, nothing is sent over HTTP
```

---

## 🧩 Real-world examples

### Login with cookies and headers

```typescript
app.post('/api/login', async (req, res) => {
  const user = await authService.login(req.body);

  if (!user) {
    return res.builder
      .as.unauthorized('Invalid credentials')
      .setHeaders('X-Auth-Reason', 'INVALID_CREDENTIALS')
      .build();
  }

  return res.builder
    .as.ok({ userId: user.id }, 'Login successful')
    .setHeaders('X-Auth-Status', 'SUCCESS')
    .setCookies('session', user.sessionToken, { httpOnly: true, secure: true })
    .build();
});
```

### List with `wrap()` and pagination

```typescript
app.get('/api/users', async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const { rows, total } = await userService.findAll({ page, limit });

  return res.builder
    .as.ok(rows)
    .paginate(total, page, limit)
    .setHeaders('X-Cache', 'MISS')
    .build();
});
```

### Conditional admin header

```typescript
app.get('/api/profile', (req, res) => {
  const user = req.user;

  return res.builder
    .as.ok(user)
    .when(user.role === 'admin', (b) => b.setHeaders('X-Admin', 'true'))
    .build();
});
```

---

## ⚡ Best practices

- Prefer `.as.*` for HTTP intent; use `.status()` when no preset fits.
- Use `req.bar.ctx.request_id` in logs; expose `metadata.request_id` to clients.
- Await `wrap()` before `.build()` in async routes.
- Pass hooks through `BarExpressAdapter` so every route shares the same lifecycle.
- Use `forceSuccess()` only when business rules diverge from HTTP semantics.

---

## 🥂 Final note

Chaining keeps response logic declarative: one schema, one dispatch, predictable metadata on every endpoint.
