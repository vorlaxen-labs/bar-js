import { ExpressDispatcher } from "../../../src/adapters/express/express.dispatcher";
import type { BarExpressResponse } from "../../../src/adapters/express/express.types";
import type { BaRFinalResult, Logger } from "../../../src/interfaces";

function createLogger(): Logger {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
}

function createResponse(
  overrides: Partial<BarExpressResponse> = {},
): BarExpressResponse {
  return {
    headersSent: false,
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    end: jest.fn(),
    cookie: jest.fn(),
    ...overrides,
  };
}

function createResult(overrides: Partial<BaRFinalResult> = {}): BaRFinalResult {
  return {
    body: {
      success: true,
      data: { ok: true },
      timestamp: "2026-01-01T00:00:00.000Z",
      metadata: {},
    },
    statusCode: 200,
    headers: {},
    cookies: [],
    ...overrides,
  };
}

describe("ExpressDispatcher", () => {
  it("headersSent ise dispatch atlanmalı ve warn loglanmalı", () => {
    const logger = createLogger();
    const res = createResponse({ headersSent: true });
    const result = createResult({
      headers: { "X-Skip": "1" },
      cookies: [{ name: "session", value: "abc" }],
    });

    const returned = new ExpressDispatcher(res, logger).dispatch(result);

    expect(returned).toBe(result);
    expect(logger.warn).toHaveBeenCalledWith(
      "BaR dispatch skipped: response headers already sent",
      { statusCode: 200 },
    );
    expect(res.setHeader).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
  });

  it("logger yokken headersSent skip throw etmemeli", () => {
    const res = createResponse({ headersSent: true });
    expect(() =>
      new ExpressDispatcher(res).dispatch(createResult()),
    ).not.toThrow();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("header ve cookie yazıp json göndermeli", () => {
    const res = createResponse();
    const result = createResult({
      headers: { "X-Custom": "yes", "X-Other": "2" },
      cookies: [
        { name: "session", value: "abc", options: { httpOnly: true } },
        { name: "theme", value: "dark" },
      ],
    });

    new ExpressDispatcher(res).dispatch(result);

    expect(res.setHeader).toHaveBeenCalledWith("X-Custom", "yes");
    expect(res.setHeader).toHaveBeenCalledWith("X-Other", "2");
    expect(res.cookie).toHaveBeenCalledWith("session", "abc", { httpOnly: true });
    expect(res.cookie).toHaveBeenCalledWith("theme", "dark", {});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result.body);
    expect(res.end).not.toHaveBeenCalled();
  });

  it("cookie yoksa res.cookie çağrılmamalı", () => {
    const res = createResponse();
    new ExpressDispatcher(res).dispatch(createResult({ cookies: [] }));
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it("204 gövdesiz end() kullanmalı", () => {
    const res = createResponse();
    const result = createResult({ statusCode: 204 });

    new ExpressDispatcher(res).dispatch(result);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalledWith();
    expect(res.json).not.toHaveBeenCalled();
  });
});
