import request from "supertest";
import express, { Request, Response } from "express";
import { BarExpressAdapter } from "../src";

function createApp() {
  const app = express();
  app.use(express.json());

  const bar = new BarExpressAdapter({
    withDefaultHeaders: true,
    logger: console,
  });

  app.use(bar.handler());

  app.get("/test-ok", (req: Request, res: Response) => {
    return res.builder.as.ok({ hello: "world" }, "All good").build();
  });

  app.get("/test-error", (req: Request, res: Response) => {
    return res.builder.as.unauthorized("Nope").build();
  });

  app.get("/test-created", (req: Request, res: Response) => {
    return res.builder.as
      .created({ id: 42, name: "test" }, "Resource created")
      .build();
  });

  app.get("/test-not-found", (req: Request, res: Response) => {
    return res.builder.as.notFound("Resource not found").build();
  });

  app.get("/test-bad-request", (req: Request, res: Response) => {
    return res.builder.as.badRequest("Invalid parameters").build();
  });

  app.get("/test-forbidden", (req: Request, res: Response) => {
    return res.builder.as.forbidden("Access denied").build();
  });

  app.get("/test-conflict", (req: Request, res: Response) => {
    return res.builder.as.conflict("Resource already exists").build();
  });

  app.get("/test-internal-error", (req: Request, res: Response) => {
    return res.builder.as.internalServerError("Something went wrong").build();
  });

  app.get("/test-no-content", (req: Request, res: Response) => {
    return res.builder.as.noContent().build();
  });

  app.get("/test-custom-headers", (req: Request, res: Response) => {
    return res.builder
      .status(200)
      .message("Custom header test")
      .data({ ok: true })
      .setHeaders("X-Custom-Header", "bar-test")
      .setHeaders("X-Request-Source", "unit-test")
      .build();
  });

  app.get("/test-custom-meta", (req: Request, res: Response) => {
    return res.builder
      .status(200)
      .message("Meta test")
      .data({ ok: true })
      .setMeta({ custom_field: "custom_value", version: "1.0.0" } as any)
      .build();
  });
  
  app.get("/test-explicit-success-override", (req: Request, res: Response) => {
    // 200 ama success: false zorla
    return res.builder
      .status(200)
      .forceSuccess(false)
      .message("Forced failure")
      .data(null)
      .build();
  });

  return app;
}

describe("BaR Express Integration", () => {
  // ─── 2xx ───────────────────────────────────────────────────────────────

  describe("2xx Successful Responses", () => {
    it("GET /test-ok → 200 OK", async () => {
      const res = await request(createApp()).get("/test-ok");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("All good");
      expect(res.body.data).toEqual({ hello: "world" });
      expect(res.body.timestamp).toBeDefined();
    });

    it("GET /test-created → 201 Created", async () => {
      const res = await request(createApp()).get("/test-created");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Resource created");
      expect(res.body.data).toEqual({ id: 42, name: "test" });
    });

    it("GET /test-no-content → 204 No Content", async () => {
      const res = await request(createApp()).get("/test-no-content");

      expect(res.status).toBe(204);
    });
  });

  // ─── 4xx ───────────────────────────────────────────────────────────────

  describe("4xx Client Error Responses", () => {
    it("GET /test-error → 401 Unauthorized", async () => {
      const res = await request(createApp()).get("/test-error");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Nope");
      expect(res.body.data).toBeNull();
    });

    it("GET /test-bad-request → 400 Bad Request", async () => {
      const res = await request(createApp()).get("/test-bad-request");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid parameters");
    });

    it("GET /test-forbidden → 403 Forbidden", async () => {
      const res = await request(createApp()).get("/test-forbidden");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Access denied");
    });

    it("GET /test-not-found → 404 Not Found", async () => {
      const res = await request(createApp()).get("/test-not-found");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Resource not found");
    });

    it("GET /test-conflict → 409 Conflict", async () => {
      const res = await request(createApp()).get("/test-conflict");

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Resource already exists");
    });
  });

  // ─── 5xx ───────────────────────────────────────────────────────────────

  describe("5xx Server Error Responses", () => {
    it("GET /test-internal-error → 500 Internal Server Error", async () => {
      const res = await request(createApp()).get("/test-internal-error");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Something went wrong");
      expect(res.body.data).toBeNull();
    });
  });

  // ─── Metadata ──────────────────────────────────────────────────────────

  describe("Metadata", () => {
    it("her response metadata içermeli", async () => {
      const res = await request(createApp()).get("/test-ok");

      expect(res.body.metadata).toBeDefined();
      expect(res.body.metadata.request_id).toBeDefined();
      expect(res.body.metadata.server_time).toBeDefined();
      expect(res.body.metadata.status_code).toBe(200);
    });

    it("her request farklı request_id almalı", async () => {
      const app = createApp();
      const res1 = await request(app).get("/test-ok");
      const res2 = await request(app).get("/test-ok");

      expect(res1.body.metadata.request_id).toBeDefined();
      expect(res2.body.metadata.request_id).toBeDefined();
      expect(res1.body.metadata.request_id).not.toBe(
        res2.body.metadata.request_id,
      );
    });

    it("metadata.status_code response status ile eşleşmeli", async () => {
      const res = await request(createApp()).get("/test-error");

      expect(res.body.metadata.status_code).toBe(401);
    });

    it("custom meta set edilebilmeli", async () => {
      const res = await request(createApp()).get("/test-custom-meta");

      expect(res.body.metadata.custom_field).toBe("custom_value");
      expect(res.body.metadata.version).toBe("1.0.0");
    });
  });

  // ─── Headers ───────────────────────────────────────────────────────────

  describe("Headers", () => {
    it("custom header'lar response'a eklenebilmeli", async () => {
      const res = await request(createApp()).get("/test-custom-headers");

      expect(res.headers["x-custom-header"]).toBe("bar-test");
      expect(res.headers["x-request-source"]).toBe("unit-test");
    });
  });

  // ─── Response Shape ────────────────────────────────────────────────────

  describe("Response Shape", () => {
    it("başarılı response shape'i doğru olmalı", async () => {
      const res = await request(createApp()).get("/test-ok");

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

    it("hatalı response shape'i doğru olmalı", async () => {
      const res = await request(createApp()).get("/test-error");

      expect(res.body).toMatchObject({
        success: false,
        message: expect.any(String),
        data: null,
        timestamp: expect.any(String),
        metadata: expect.objectContaining({
          request_id: expect.any(String),
          server_time: expect.any(String),
          status_code: expect.any(Number),
        }),
      });
    });

    it("timestamp ISO 8601 formatında olmalı", async () => {
      const res = await request(createApp()).get("/test-ok");

      expect(() => new Date(res.body.timestamp).toISOString()).not.toThrow();
    });

    it("success flag explicit override edilebilmeli", async () => {
      const res = await request(createApp()).get(
        "/test-explicit-success-override",
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false); // 200 ama success: false
    });
  });
});
