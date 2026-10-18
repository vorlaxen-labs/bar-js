import { FastifyDispatcher } from "../../../src/adapters/fastify/fastify.dispatcher";
import type { BarFastifyReply } from "../../../src/adapters/fastify/fastify.types";
import type { BaRFinalResult, Logger } from "../../../src/interfaces";

function createLogger(): Logger {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
}

function createReply(
  overrides: Partial<BarFastifyReply> = {},
): BarFastifyReply {
  return {
    sent: false,
    raw: { headersSent: false },
    header: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    setCookie: jest.fn().mockReturnThis(),
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

describe("FastifyDispatcher", () => {
  it("reply.sent ise dispatch atlanmalı ve warn loglanmalı", () => {
    const logger = createLogger();
    const reply = createReply({ sent: true });
    const result = createResult({
      headers: { "X-Skip": "1" },
      cookies: [{ name: "session", value: "abc" }],
    });

    const returned = new FastifyDispatcher(reply, logger).dispatch(result);

    expect(returned).toBe(result);
    expect(logger.warn).toHaveBeenCalledWith(
      "BaR dispatch skipped: response headers already sent",
      { statusCode: 200 },
    );
    expect(reply.header).not.toHaveBeenCalled();
    expect(reply.setCookie).not.toHaveBeenCalled();
    expect(reply.status).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it("raw.headersSent ise dispatch atlanmalı", () => {
    const logger = createLogger();
    const reply = createReply({ raw: { headersSent: true } });

    new FastifyDispatcher(reply, logger).dispatch(createResult());

    expect(logger.warn).toHaveBeenCalledWith(
      "BaR dispatch skipped: response headers already sent",
      { statusCode: 200 },
    );
    expect(reply.send).not.toHaveBeenCalled();
  });

  it("header ve cookie yazıp send etmeli", () => {
    const reply = createReply();
    const result = createResult({
      headers: { "X-Custom": "yes", "X-Other": "2" },
      cookies: [
        { name: "session", value: "abc", options: { httpOnly: true } },
        { name: "theme", value: "dark" },
      ],
    });

    new FastifyDispatcher(reply).dispatch(result);

    expect(reply.header).toHaveBeenCalledWith("X-Custom", "yes");
    expect(reply.header).toHaveBeenCalledWith("X-Other", "2");
    expect(reply.setCookie).toHaveBeenCalledWith("session", "abc", {
      httpOnly: true,
    });
    expect(reply.setCookie).toHaveBeenCalledWith("theme", "dark", {});
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(result.body);
  });

  it("setCookie yoksa cookie atlanmalı ve warn loglanmalı", () => {
    const logger = createLogger();
    const reply = createReply();
    delete reply.setCookie;
    const result = createResult({
      cookies: [{ name: "session", value: "abc" }],
    });

    new FastifyDispatcher(reply, logger).dispatch(result);

    expect(logger.warn).toHaveBeenCalledWith(
      "BaR dispatch: cookies skipped — register @fastify/cookie on your Fastify instance",
    );
    expect(reply.send).toHaveBeenCalledWith(result.body);
  });

  it("cookie yoksa setCookie ve cookie uyarısı yok", () => {
    const logger = createLogger();
    const reply = createReply();

    new FastifyDispatcher(reply, logger).dispatch(createResult({ cookies: [] }));

    expect(reply.setCookie).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("204 gövdesiz send() kullanmalı", () => {
    const reply = createReply();
    const result = createResult({ statusCode: 204 });

    new FastifyDispatcher(reply).dispatch(result);

    expect(reply.status).toHaveBeenCalledWith(204);
    expect(reply.send).toHaveBeenCalledWith();
  });
});
