import request from "supertest";
import express, { Request, Response } from "express";
import {
  BarExpressAdapter,
  BaRHooks,
  DEFAULT_SECURITY_HEADERS,
  ResponseBuilder,
} from "../src";

const silentLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

type AppOptions = {
  withDefaultHeaders?: boolean;
  environment?: "development" | "production" | "test";
  hooks?: BaRHooks;
};

function createApp(options: AppOptions = {}) {
  const app = express();
  app.use(express.json());

  const bar = new BarExpressAdapter({
    withDefaultHeaders: options.withDefaultHeaders ?? true,
    logger: silentLogger,
    hooks: options.hooks,
    environment: options.environment ?? "development",
  });

  app.use(bar.handler());

  app.get("/test-ok", (_req: Request, res: Response) => {
    return res.builder.as.ok({ hello: "world" }, "All good").build();
  });

  app.get("/test-error", (_req: Request, res: Response) => {
    return res.builder.as.unauthorized("Nope").build();
  });

  app.get("/test-created", (_req: Request, res: Response) => {
    return res.builder.as
      .created({ id: 42, name: "test" }, "Resource created")
      .build();
  });

  app.get("/test-not-found", (_req: Request, res: Response) => {
    return res.builder.as.notFound("Resource not found").build();
  });

  app.get("/test-bad-request", (_req: Request, res: Response) => {
    return res.builder.as.badRequest("Invalid parameters").build();
  });

  app.get("/test-forbidden", (_req: Request, res: Response) => {
    return res.builder.as.forbidden("Access denied").build();
  });

  app.get("/test-conflict", (_req: Request, res: Response) => {
    return res.builder.as.conflict("Resource already exists").build();
  });

  app.get("/test-internal-error", (_req: Request, res: Response) => {
    return res.builder.as.internalServerError("Something went wrong").build();
  });

  app.get("/test-no-content", (_req: Request, res: Response) => {
    return res.builder.as.noContent().build();
  });

  app.get("/test-custom-headers", (_req: Request, res: Response) => {
    return res.builder
      .status(200)
      .message("Custom header test")
      .data({ ok: true })
      .header("X-Custom-Header", "bar-test")
      .setHeaders("X-Request-Source", "unit-test")
      .build();
  });

  app.get("/test-custom-meta", (_req: Request, res: Response) => {
    return res.builder
      .status(200)
      .message("Meta test")
      .data({ ok: true })
      .setMeta({ custom_field: "custom_value", version: "1.0.0" } as any)
      .build();
  });

  app.get("/test-bar-ctx", (req: Request, res: Response) => {
    return res.builder
      .as.ok(
        {
          request_id: req.bar.ctx.request_id,
          start_time: req.bar.ctx.start_time,
        },
        "Context available",
      )
      .build();
  });

  app.get("/test-explicit-success-override", (_req: Request, res: Response) => {
    return res.builder
      .status(200)
      .forceSuccess(false)
      .message("Forced failure")
      .data(null)
      .build();
  });

  app.get("/test-cookies", (_req: Request, res: Response) => {
    return res.builder
      .as.ok({ ok: true })
      .setCookies("session", "abc", { httpOnly: true })
      .build();
  });

  app.get("/test-stale-data-after-error", (_req: Request, res: Response) => {
    return res.builder
      .data({ secret: "should-not-leak" })
      .as.notFound("Gone")
      .build();
  });

  app.get("/test-wrap-prod", async (_req: Request, res: Response) => {
    await res.builder.wrap(Promise.reject(new Error("DB connection leaked")));
    return res.builder.build();
  });

  app.get("/test-double-send", (_req: Request, res: Response) => {
    res.status(200).send("already");
    return res.builder.as.ok({ ignored: true }).build();
  });

  app.get("/test-ok-undefined-data", (_req: Request, res: Response) => {
    return res.builder.as.ok(undefined, "No payload").build();
  });

  return app;
}

describe("BaR Express Integration", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe("2xx Successful Responses", () => {
    it("GET /test-ok → 200 OK", async () => {
      const res = await request(app).get("/test-ok");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("All good");
      expect(res.body.data).toEqual({ hello: "world" });
      expect(res.body.timestamp).toBeDefined();
    });

    it("GET /test-created → 201 Created", async () => {
      const res = await request(app).get("/test-created");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Resource created");
      expect(res.body.data).toEqual({ id: 42, name: "test" });
    });

    it("GET /test-no-content → 204, gövdesiz", async () => {
      const res = await request(app).get("/test-no-content");

      expect(res.status).toBe(204);
      expect(res.text).toBe("");
      expect(Object.keys(res.body).length).toBe(0);
    });

    it("GET /test-ok-undefined-data → data null", async () => {
      const res = await request(app).get("/test-ok-undefined-data");

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });
  });

  describe("4xx Client Error Responses", () => {
    it("GET /test-error → 401 Unauthorized", async () => {
      const res = await request(app).get("/test-error");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Nope");
      expect(res.body.data).toBeNull();
    });

    it("GET /test-bad-request → 400 Bad Request", async () => {
      const res = await request(app).get("/test-bad-request");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid parameters");
      expect(res.body.data).toBeNull();
    });

    it("GET /test-forbidden → 403 Forbidden", async () => {
      const res = await request(app).get("/test-forbidden");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Access denied");
    });

    it("GET /test-not-found → 404 Not Found", async () => {
      const res = await request(app).get("/test-not-found");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Resource not found");
    });

    it("GET /test-conflict → 409 Conflict", async () => {
      const res = await request(app).get("/test-conflict");

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Resource already exists");
    });

    it("önce data set edilip sonra hata preset → data null", async () => {
      const res = await request(app).get("/test-stale-data-after-error");

      expect(res.status).toBe(404);
      expect(res.body.data).toBeNull();
    });
  });

  describe("5xx Server Error Responses", () => {
    it("GET /test-internal-error → 500 Internal Server Error", async () => {
      const res = await request(app).get("/test-internal-error");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Something went wrong");
      expect(res.body.data).toBeNull();
    });
  });

  describe("Request Context (req.bar.ctx)", () => {
    it("GET /test-bar-ctx → ctx erişilebilir", async () => {
      const res = await request(app).get("/test-bar-ctx");

      expect(res.status).toBe(200);
      expect(res.body.data.request_id).toBeDefined();
      expect(typeof res.body.data.start_time).toBe("number");
      expect(res.body.data.request_id).toBe(res.body.metadata.request_id);
    });

    it("X-Request-ID upstream id devralınmalı", async () => {
      const incoming = "a1b2c3d4-e5f6-4789-a012-3456789abcde";
      const res = await request(app)
        .get("/test-bar-ctx")
        .set("X-Request-ID", incoming);

      expect(res.body.metadata.request_id).toBe(incoming);
      expect(res.body.data.request_id).toBe(incoming);
    });

    it("her request farklı request_id (header yoksa)", async () => {
      const res1 = await request(app).get("/test-ok");
      const res2 = await request(app).get("/test-ok");

      expect(res1.body.metadata.request_id).not.toBe(
        res2.body.metadata.request_id,
      );
    });
  });

  describe("Metadata", () => {
    it("her response metadata içermeli", async () => {
      const res = await request(app).get("/test-ok");

      expect(res.body.metadata).toMatchObject({
        request_id: expect.any(String),
        server_time: expect.any(String),
        status_code: 200,
      });
    });

    it("metadata.status_code response status ile eşleşmeli", async () => {
      const res = await request(app).get("/test-error");

      expect(res.body.metadata.status_code).toBe(401);
    });

    it("custom meta set edilebilmeli", async () => {
      const res = await request(app).get("/test-custom-meta");

      expect(res.body.metadata.custom_field).toBe("custom_value");
      expect(res.body.metadata.version).toBe("1.0.0");
    });
  });

  describe("Headers", () => {
    it(".header() ve setHeaders çalışmalı", async () => {
      const res = await request(app).get("/test-custom-headers");

      expect(res.headers["x-custom-header"]).toBe("bar-test");
      expect(res.headers["x-request-source"]).toBe("unit-test");
    });

    it("varsayılan güvenlik headerları uygulanmalı", async () => {
      const res = await request(app).get("/test-ok");

      expect(res.headers["x-content-type-options"]).toBe(
        DEFAULT_SECURITY_HEADERS["X-Content-Type-Options"].toLowerCase(),
      );
      expect(res.headers["x-frame-options"]).toBe("DENY");
      expect(res.headers["cache-control"]).toBe("no-store");
    });

    it("withDefaultHeaders: false → güvenlik headerları yok", async () => {
      const noHeadersApp = createApp({ withDefaultHeaders: false });
      const res = await request(noHeadersApp).get("/test-ok");

      expect(res.headers["x-frame-options"]).toBeUndefined();
    });
  });

  describe("Cookies", () => {
    it("Set-Cookie header gönderilmeli", async () => {
      const res = await request(app).get("/test-cookies");

      const setCookie = res.headers["set-cookie"];
      expect(setCookie).toBeDefined();
      const cookieHeader = Array.isArray(setCookie) ? setCookie.join(";") : setCookie;
      expect(cookieHeader).toMatch(/session=/);
      expect(cookieHeader?.toLowerCase()).toMatch(/httponly/);
    });
  });

  describe("Response Shape", () => {
    it("başarılı response shape", async () => {
      const res = await request(app).get("/test-ok");

      expect(res.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
        timestamp: expect.any(String),
        metadata: expect.objectContaining({
          request_id: expect.any(String),
          server_time: expect.any(String),
          status_code: expect.any(Number),
        }),
      });
    });

    it("hatalı response shape", async () => {
      const res = await request(app).get("/test-error");

      expect(res.body).toMatchObject({
        success: false,
        message: expect.any(String),
        data: null,
        timestamp: expect.any(String),
      });
    });

    it("timestamp ISO 8601", async () => {
      const res = await request(app).get("/test-ok");
      expect(() => new Date(res.body.timestamp).toISOString()).not.toThrow();
    });

    it("forceSuccess override", async () => {
      const res = await request(app).get("/test-explicit-success-override");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Production safety", () => {
    it("production wrap hata detayı sızdırmamalı", async () => {
      const prodApp = createApp({ environment: "production" });
      const res = await request(prodApp).get("/test-wrap-prod");

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Internal Server Error");
      expect(res.body.message).not.toContain("DB connection");
    });
  });

  describe("Dispatcher edge cases", () => {
    it("headersSent ise ikinci dispatch atlanmalı ve warn loglanmalı", async () => {
      const res = await request(app).get("/test-double-send");

      expect(res.status).toBe(200);
      expect(res.text).toBe("already");
      expect(silentLogger.warn).toHaveBeenCalledWith(
        "BaR dispatch skipped: response headers already sent",
        expect.objectContaining({ statusCode: 200 }),
      );
    });
  });

  describe("Hooks (integration)", () => {
    it("before_dispatch / after_dispatch tetiklenmeli", async () => {
      const hooks = new BaRHooks();
      const beforeDispatch = jest.fn();
      const afterDispatch = jest.fn();
      hooks.on("before_dispatch", beforeDispatch);
      hooks.on("after_dispatch", afterDispatch);

      const hookApp = createApp({ hooks });
      await request(hookApp).get("/test-ok");

      expect(beforeDispatch).toHaveBeenCalledTimes(1);
      expect(afterDispatch).toHaveBeenCalledTimes(1);
      expect(beforeDispatch.mock.calls[0][0]).toMatchObject({
        statusCode: 200,
        body: expect.objectContaining({ success: true }),
      });
    });
  });
});

describe("BarExpressAdapter — vanilla builder without dispatch", () => {
  it("middleware olmadan ResponseBuilder hâlâ kullanılabilir", () => {
    const result = new ResponseBuilder().as.ok({ x: 1 }).build();
    expect(result.statusCode).toBe(200);
    expect(result.body.data).toEqual({ x: 1 });
  });
});
