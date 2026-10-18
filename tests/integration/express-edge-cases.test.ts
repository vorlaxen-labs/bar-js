import { ResponseBuilder } from "../../src";
import { createExpressTestApp } from "../apps/create-express-app";
import { hitExpress } from "../clients/express.client";
import { STANDARD_ROUTE_PATHS } from "../shared/route-paths";
import { clearSilentLoggerMocks, silentLogger } from "../shared/silent-logger";

describe("Express-only edge cases", () => {
  beforeEach(() => {
    clearSilentLoggerMocks();
  });

  it("headersSent ise ikinci dispatch atlanmalı ve warn loglanmalı", async () => {
    const app = createExpressTestApp();
    const res = await hitExpress(app, {
      path: STANDARD_ROUTE_PATHS.doubleSend,
    });

    expect(res.status).toBe(200);
    expect(res.text).toBe("already");
    expect(silentLogger.warn).toHaveBeenCalledWith(
      "BaR dispatch skipped: response headers already sent",
      expect.objectContaining({ statusCode: 200 }),
    );
  });
});

describe("BarExpressAdapter — vanilla builder without dispatch", () => {
  it("middleware olmadan ResponseBuilder hâlâ kullanılabilir", () => {
    const result = new ResponseBuilder().as.ok({ x: 1 }).build();
    expect(result.statusCode).toBe(200);
    expect(result.body.data).toEqual({ x: 1 });
  });
});
