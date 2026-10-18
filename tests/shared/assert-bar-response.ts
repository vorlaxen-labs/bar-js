import { DEFAULT_SECURITY_HEADERS } from "../../src";
import type { BarHttpHeaders, BarHttpResponse, ScenarioExpect } from "./types";

export function assertBarResponse(
  res: BarHttpResponse,
  expected: ScenarioExpect,
): void {
  expect(res.status).toBe(expected.status);

  if (expected.emptyBody) {
    expect(res.text).toBe("");
    expect(res.body === null || Object.keys(res.body).length === 0).toBe(true);
    return;
  }

  if (!res.body) {
    throw new Error("Expected JSON body but response body is empty");
  }

  const body = res.body;

  if (expected.bodyPartial) {
    expect(body).toMatchObject(expected.bodyPartial);
  }

  if (expected.bodyAssert) {
    expected.bodyAssert(body);
  }

  if (expected.metadataPartial) {
    expect(body.metadata).toMatchObject(expected.metadataPartial);
  }

  if (expected.assertSuccessShape) {
    assertSuccessShape(body);
  }

  if (expected.assertErrorShape) {
    assertErrorShape(body);
  }

  if (expected.timestampIso) {
    expect(() => new Date(String(body.timestamp)).toISOString()).not.toThrow();
  }

  if (expected.messageMustNotContain) {
    const error = body.error as Record<string, unknown> | undefined;
    const text =
      typeof error?.message === "string"
        ? error.message
        : typeof body.message === "string"
          ? body.message
          : "";
    expect(text).not.toContain(expected.messageMustNotContain);
  }

  if (expected.responseHeaders) {
    for (const [key, value] of Object.entries(expected.responseHeaders)) {
      const actual = res.headers[key.toLowerCase()];
      if (value instanceof RegExp) {
        expect(String(actual)).toMatch(value);
      } else {
        expect(actual).toBe(value);
      }
    }
  }

  if (expected.cookies) {
    assertSetCookie(res.headers, expected.cookies);
  }
}

export function assertSuccessShape(body: Record<string, unknown>): void {
  expect(body).toMatchObject({
    success: true,
    message: expect.any(String),
    timestamp: expect.any(String),
    metadata: expect.objectContaining({
      request_id: expect.any(String),
      server_time: expect.any(String),
      status_code: expect.any(Number),
    }),
  });
}

export function assertErrorShape(body: Record<string, unknown>): void {
  expect(body).toMatchObject({
    success: false,
    data: null,
    timestamp: expect.any(String),
    error: {
      code: expect.any(String),
      message: expect.any(String),
    },
  });
  expect(body.message).toBeUndefined();
}

export function assertSecurityHeaders(headers: BarHttpHeaders): void {
  expect(headers["x-content-type-options"]).toBe(
    DEFAULT_SECURITY_HEADERS["X-Content-Type-Options"].toLowerCase(),
  );
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["cache-control"]).toBe("no-store");

  for (const [key, value] of Object.entries(DEFAULT_SECURITY_HEADERS)) {
    expect(headers[key.toLowerCase()]).toBe(value);
  }
}

export function assertSetCookie(
  headers: BarHttpHeaders,
  cookie: { name: string; flags?: string[] },
): void {
  const setCookie = headers["set-cookie"];
  expect(setCookie).toBeDefined();
  const cookieHeader = Array.isArray(setCookie)
    ? setCookie.join(";")
    : String(setCookie);
  expect(cookieHeader).toMatch(new RegExp(`${cookie.name}=`));
  for (const flag of cookie.flags ?? []) {
    expect(cookieHeader.toLowerCase()).toContain(flag.toLowerCase());
  }
}

export function assertRequestIdPropagation(
  body: Record<string, unknown>,
  incoming: string,
): void {
  const metadata = body.metadata as Record<string, unknown>;
  const data = body.data as Record<string, unknown>;
  expect(metadata.request_id).toBe(incoming);
  expect(data.request_id).toBe(incoming);
}
