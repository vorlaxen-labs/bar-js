import { STANDARD_ROUTE_PATHS as P } from "./route-paths";
import type { ScenarioCase } from "./types";

export const STANDARD_SCENARIOS: ScenarioCase[] = [
  {
    name: "GET /test-ok → 200 OK",
    path: P.ok,
    expect: {
      status: 200,
      bodyPartial: {
        success: true,
        message: "All good",
        data: { hello: "world" },
      },
      bodyAssert: (body) => {
        expect(body.timestamp).toBeDefined();
      },
    },
  },
  {
    name: "GET /test-created → 201 Created",
    path: P.created,
    expect: {
      status: 201,
      bodyPartial: {
        success: true,
        message: "Resource created",
        data: { id: 42, name: "test" },
      },
    },
  },
  {
    name: "GET /test-no-content → 204, gövdesiz",
    path: P.noContent,
    expect: { status: 204, emptyBody: true },
  },
  {
    name: "GET /test-ok-undefined-data → data null",
    path: P.okUndefinedData,
    expect: {
      status: 200,
      bodyPartial: { data: null },
    },
  },
  {
    name: "GET /test-error → 401 Unauthorized",
    path: P.error,
    expect: {
      status: 401,
      bodyPartial: {
        success: false,
        data: null,
        error: { code: "UNAUTHORIZED", message: "Nope" },
      },
    },
  },
  {
    name: "GET /test-bad-request → 400 Bad Request",
    path: P.badRequest,
    expect: {
      status: 400,
      bodyPartial: {
        success: false,
        data: null,
        error: { code: "BAD_REQUEST", message: "Invalid parameters" },
      },
    },
  },
  {
    name: "GET /test-forbidden → 403 Forbidden",
    path: P.forbidden,
    expect: {
      status: 403,
      bodyPartial: {
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied" },
      },
    },
  },
  {
    name: "GET /test-not-found → 404 Not Found",
    path: P.notFound,
    expect: {
      status: 404,
      bodyPartial: {
        success: false,
        error: { code: "NOT_FOUND", message: "Resource not found" },
      },
    },
  },
  {
    name: "GET /test-conflict → 409 Conflict",
    path: P.conflict,
    expect: {
      status: 409,
      bodyPartial: {
        success: false,
        error: { code: "CONFLICT", message: "Resource already exists" },
      },
    },
  },
  {
    name: "önce data set edilip sonra hata preset → data null",
    path: P.staleDataAfterError,
    expect: {
      status: 404,
      bodyPartial: { data: null },
    },
  },
  {
    name: "GET /test-internal-error → 500 Internal Server Error",
    path: P.internalError,
    expect: {
      status: 500,
      bodyPartial: {
        success: false,
        data: null,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" },
      },
    },
  },
  {
    name: "GET /test-bar-ctx → ctx erişilebilir",
    path: P.barCtx,
    expect: {
      status: 200,
      bodyAssert: (body) => {
        const data = body.data as Record<string, unknown>;
        const metadata = body.metadata as Record<string, unknown>;
        expect(data.request_id).toBeDefined();
        expect(typeof data.start_time).toBe("number");
        expect(data.request_id).toBe(metadata.request_id);
      },
    },
  },
  {
    name: "X-Request-ID upstream id devralınmalı",
    path: P.barCtx,
    requestHeaders: {
      "X-Request-ID": "a1b2c3d4-e5f6-4789-a012-3456789abcde",
    },
    expect: {
      status: 200,
      bodyAssert: (body) => {
        const incoming = "a1b2c3d4-e5f6-4789-a012-3456789abcde";
        const data = body.data as Record<string, unknown>;
        const metadata = body.metadata as Record<string, unknown>;
        expect(metadata.request_id).toBe(incoming);
        expect(data.request_id).toBe(incoming);
      },
    },
  },
  {
    name: "her response metadata içermeli",
    path: P.ok,
    expect: {
      status: 200,
      metadataPartial: {
        request_id: expect.any(String),
        server_time: expect.any(String),
        status_code: 200,
      },
    },
  },
  {
    name: "metadata.status_code response status ile eşleşmeli",
    path: P.error,
    expect: {
      status: 401,
      metadataPartial: { status_code: 401 },
    },
  },
  {
    name: "custom meta set edilebilmeli",
    path: P.customMeta,
    expect: {
      status: 200,
      metadataPartial: {
        custom_field: "custom_value",
        version: "1.0.0",
      },
    },
  },
  {
    name: ".header() ve setHeaders çalışmalı",
    path: P.customHeaders,
    expect: {
      status: 200,
      responseHeaders: {
        "x-custom-header": "bar-test",
        "x-request-source": "unit-test",
      },
    },
  },
  {
    name: "Set-Cookie header gönderilmeli",
    path: P.cookies,
    expect: {
      status: 200,
      cookies: { name: "session", flags: ["httponly"] },
    },
  },
  {
    name: "başarılı response shape",
    path: P.ok,
    expect: {
      status: 200,
      assertSuccessShape: true,
      bodyAssert: (body) => {
        expect(body.data).toEqual(expect.any(Object));
      },
    },
  },
  {
    name: "hatalı response shape",
    path: P.error,
    expect: {
      status: 401,
      assertErrorShape: true,
    },
  },
  {
    name: "timestamp ISO 8601",
    path: P.ok,
    expect: {
      status: 200,
      timestampIso: true,
    },
  },
  {
    name: "forceSuccess override",
    path: P.explicitSuccessOverride,
    expect: {
      status: 200,
      bodyPartial: { success: false },
    },
  },
  {
    name: "production wrap hata detayı sızdırmamalı",
    path: P.wrapProd,
    appOptions: { environment: "production" },
    expect: {
      status: 500,
      bodyPartial: {
        error: { code: "INTERNAL_SERVER_ERROR", message: "Internal Server Error" },
      },
      messageMustNotContain: "DB connection",
    },
  },
];
