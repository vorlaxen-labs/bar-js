# Advanced chaining

BaR gives you fine-grained control over status, headers, cookies, metadata, and async data while keeping a single `.build()` dispatch at the end.

Topics in this guide:

- Custom status codes and `forceSuccess()`
- Headers and cookies
- `setMeta()`, `paginate()`, `withMetadata()`
- `wrap()`, `transform()`, `when()`
- Lifecycle hooks and the `error` hook
- Production error masking (`environment`, `includeStack`)

For preset names and default messages, see [API reference](./api-reference.md#semantic-presets-as).

---

## Chaining fundamentals

Every chain method returns the same builder instance:

```typescript
return res.builder
  .as.ok(data)
  .setHeaders('X-Custom', 'value')
  .build();
```

---

## Custom status codes

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

## Overriding the `success` flag

By default, `success` is `true` when `200 <= status < 400`.

```typescript
return res.builder
  .status(200)
  .forceSuccess(false)
  .message('Validation passed but no action taken')
  .data(null)
  .build();
```

Error presets (`.as.unauthorized()`, etc.) already call `forceSuccess(false)`.

---

## Headers

### Single header

Use `setHeaders` or the `header` alias:

```typescript
return res.builder
  .as.ok({ success: true })
  .setHeaders('X-RateLimit-Remaining', '42')
  .header('X-App-Version', '1.3.0')
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

Adapter-level headers (`withDefaultHeaders`) are set on the raw framework response before your route runs. Builder headers are applied at dispatch time and can override defaults when keys collide.

---

## Cookies

### Single cookie (with options)

```typescript
return res.builder
  .as.ok({ loggedIn: true })
  .setCookies('session', 'abc123', { httpOnly: true, secure: true })
  .build();
```

`ExpressDispatcher` calls `res.cookie()`; Fastify uses `reply.setCookie` when `@fastify/cookie` is registered.

### Multiple cookies (object shorthand)

```typescript
return res.builder
  .as.ok(data)
  .setCookies({ theme: 'dark', lang: 'en' })
  .build();
```

For per-cookie options, use the three-argument form for each cookie.

---

## Default security headers

When `withDefaultHeaders` is not `false`, the adapter applies `DEFAULT_SECURITY_HEADERS` (or your `defaultHeaders` override) on every request. See [API reference](./api-reference.md#default_security_headers).

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

## Metadata

### `setMeta()` — merge custom fields

```typescript
return res.builder
  .status(200)
  .message('Meta test')
  .data({ ok: true })
  .setMeta({ custom_field: 'custom_value', version: '1.0.0' })
  .build();
```

Result metadata includes `status_code`, `request_id`, `server_time`, plus your custom keys.

### `withMetadata()` — merge factory-generated fields

```typescript
return res.builder
  .status(200)
  .withMetadata({ status_code: 200 })
  .build();
```

At `.build()` time, `request_id` from `req.bar.ctx` (or Fastify equivalent) is always applied to the final metadata.

---

## Pagination

```typescript
return res.builder
  .paginate(users, { strategy: 'offset', total: 100, page: 2, limit: 20 })
  .message('Users loaded')
  .build();
```

Cursor-based lists:

```typescript
return res.builder
  .paginate(users, {
    strategy: 'cursor',
    limit: 20,
    next_cursor: 'cursor-token',
    prev_cursor: null,
  })
  .build();
```

Adds a `pagination` object under `metadata` (includes `strategy: 'offset' | 'cursor'`).

`paginate()` throws if `limit <= 0`.

---

## Async support with `wrap()`

`wrap()` is **async** — await it, then call `.build()`.

### Success

```typescript
app.get('/api/users/:id', async (req, res) => {
  await res.builder.wrap(userService.findById(req.params.id));
  return res.builder.build();
});
```

Resolved values become `.data()`; status stays whatever you set (default `200` unless you used a preset first).

### Rejection

```typescript
await res.builder.wrap(Promise.reject(new Error('DB Error')));
return res.builder.build();
// → 500, success: false, error.message from exception (see production masking below)
```

On rejection, BaR emits the **`error`** hook with `{ error, message, statusCode }`. See [Hooks](#lifecycle-hooks).

### Production error masking

When `environment: 'production'` is set on the adapter (passed into `ResponseBuilder` options), clients see `"Internal Server Error"` instead of the raw exception message.

When `includeStack: true` and environment is **not** production, `wrap()` may use `error.stack` as the message if the rejection is an `Error`.

---

## `transform()`

Runs when `data` is not `null`; calls can be chained:

```typescript
return res.builder
  .data(10)
  .transform((n) => n * 2)
  .transform((n) => `Value: ${n}`)
  .build();
```

---

## `when()`

```typescript
return res.builder
  .as.ok(user)
  .when(isAdmin, (b) => b.setHeaders('X-Admin', 'true'))
  .when(isPaginated, (b) =>
    b.paginate(rows, { strategy: 'offset', total, page, limit }),
  )
  .build();
```

---

## Lifecycle hooks

Configure hooks on `BarExpressAdapter`, `registerBarFastify` / `BarFastifyPlugin`, or on a standalone `ResponseBuilder` / `BaR` instance.

### Express setup

```typescript
import { BaRHooks } from '@vorlaxen-labs/bar-js';
import { BarExpressAdapter } from '@vorlaxen-labs/bar-js/adapters/express';

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

hooks.on('error', (payload) => {
  console.log('wrap() or hook failure', payload);
});

const bar = new BarExpressAdapter({ hooks, logger: console });
app.use(bar.handler());
```

### Hook events

| Event | When | Payload |
|-------|------|---------|
| `before_build` | Before body assembly | `{ statusCode: number }` |
| `after_build` | After body assembly | `BaRFinalResult` (structured clone) |
| `before_dispatch` | Before `dispatcher.dispatch()` | `BaRFinalResult` (structured clone) |
| `after_dispatch` | After dispatch | `BaRFinalResult` (structured clone) |
| `error` | `wrap()` rejection, or another hook threw | See [API reference](./api-reference.md#barhooks) |

`after_build` and dispatch hooks receive a **structured clone**. Mutating the clone does not change what was sent.

If a non-`error` hook throws, BaR logs a warning and emits `error` with `{ sourceEvent, error, payload }`.

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

## Real-world examples

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

### List with pagination

```typescript
app.get('/api/users', async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const { rows, total } = await userService.findAll({ page, limit });

  return res.builder
    .paginate(rows, { strategy: 'offset', total, page, limit })
    .message('Users loaded')
    .setHeaders('X-Cache', 'MISS')
    .build();
});
```

---

## Best practices

- Prefer `.as.*` for HTTP intent; use `.status()` when no preset fits.
- Use `req.bar.ctx.request_id` in logs; expose `metadata.request_id` to clients.
- Await `wrap()` before `.build()` in async routes.
- Pass hooks through the adapter so every route shares the same lifecycle.
- Use `forceSuccess()` only when business rules diverge from HTTP semantics.
- Set `environment: 'production'` in production so `wrap()` does not leak stack traces unless you intentionally use `includeStack` in non-production.

---

## Next steps

- [API reference](./api-reference.md) — full preset and builder method tables
- [Adapters](./adapters.md) — dispatcher behavior and integration options
