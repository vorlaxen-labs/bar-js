import { BaRHooks } from "../../src";
import {
  createExpressTestApp,
  type ExpressTestApp,
} from "../apps/create-express-app";
import { createFastifyTestApp } from "../apps/create-fastify-app";
import { hitExpress } from "../clients/express.client";
import { hitFastify } from "../clients/fastify.client";
import {
  assertBarResponse,
  assertSecurityHeaders,
} from "../shared/assert-bar-response";
import { STANDARD_ROUTE_PATHS } from "../shared/route-paths";
import { STANDARD_SCENARIOS } from "../shared/scenario-definitions";
import { clearSilentLoggerMocks, silentLogger } from "../shared/silent-logger";
import type { HttpRequestBody } from "../shared/http-request.types";
import type { AdapterName, BarHttpResponse, TestAppOptions } from "../shared/types";
import type { FastifyInstance } from "fastify";

type AdapterContext = {
  hit: (opts: {
    path: string;
    method?: "GET" | "POST";
    body?: HttpRequestBody;
    headers?: Record<string, string>;
    appOptions?: TestAppOptions;
  }) => Promise<BarHttpResponse>;
  teardown: () => Promise<void>;
};

async function createAdapterContext(
  adapter: AdapterName,
  appOptions?: TestAppOptions,
): Promise<AdapterContext> {
  if (adapter === "express") {
    let app: ExpressTestApp = createExpressTestApp(appOptions);
    return {
      hit: async (opts) => {
        if (opts.appOptions) {
          app = createExpressTestApp(opts.appOptions);
        }
        return hitExpress(app, {
          path: opts.path,
          method: opts.method,
          body: opts.body,
          headers: opts.headers,
        });
      },
      teardown: async () => {},
    };
  }

  let app: FastifyInstance = await createFastifyTestApp(appOptions);
  return {
    hit: async (opts) => {
      if (opts.appOptions) {
        await app.close();
        app = await createFastifyTestApp(opts.appOptions);
      }
      return hitFastify(app, {
        path: opts.path,
        method: opts.method,
        body: opts.body,
        headers: opts.headers,
      });
    },
    teardown: async () => {
      await app.close();
    },
  };
}

describe.each<AdapterName>(["express", "fastify"])(
  "BaR adapter parity (%s)",
  (adapter) => {
    let ctx: AdapterContext;

    beforeEach(async () => {
      clearSilentLoggerMocks();
      ctx = await createAdapterContext(adapter);
    });

    afterEach(async () => {
      await ctx.teardown();
    });

    describe.each(STANDARD_SCENARIOS.map((s) => [s.name, s] as const))(
      "%s",
      (_name, scenario) => {
        it("response matches expectations", async () => {
          const res = await ctx.hit({
            path: scenario.path,
            method: scenario.method,
            body: scenario.body,
            headers: scenario.requestHeaders,
            appOptions: scenario.appOptions,
          });

          assertBarResponse(res, scenario.expect);
        });
      },
    );

    it("varsayılan güvenlik headerları uygulanmalı", async () => {
      const res = await ctx.hit({ path: STANDARD_ROUTE_PATHS.ok });
      assertSecurityHeaders(res.headers);
    });

    it("withDefaultHeaders: false → güvenlik headerları yok", async () => {
      const res = await ctx.hit({
        path: STANDARD_ROUTE_PATHS.ok,
        appOptions: { withDefaultHeaders: false },
      });
      expect(res.headers["x-frame-options"]).toBeUndefined();
    });

    it("headersSent ise ikinci dispatch atlanmalı ve warn loglanmalı", async () => {
      const res = await ctx.hit({ path: STANDARD_ROUTE_PATHS.doubleSend });

      expect(res.status).toBe(200);
      expect(res.text).toBe("already");
      expect(silentLogger.warn).toHaveBeenCalledWith(
        "BaR dispatch skipped: response headers already sent",
        expect.objectContaining({ statusCode: 200 }),
      );
    });

    it("her request farklı request_id (header yoksa)", async () => {
      const res1 = await ctx.hit({ path: STANDARD_ROUTE_PATHS.ok });
      const res2 = await ctx.hit({ path: STANDARD_ROUTE_PATHS.ok });

      expect(res1.body?.metadata).toBeDefined();
      expect(res2.body?.metadata).toBeDefined();
      const id1 = (res1.body!.metadata as Record<string, unknown>).request_id;
      const id2 = (res2.body!.metadata as Record<string, unknown>).request_id;
      expect(id1).not.toBe(id2);
    });

    describe("Hooks (integration)", () => {
      it("before_dispatch / after_dispatch tetiklenmeli", async () => {
        const hooks = new BaRHooks();
        const beforeDispatch = jest.fn();
        const afterDispatch = jest.fn();
        hooks.on("before_dispatch", beforeDispatch);
        hooks.on("after_dispatch", afterDispatch);

        await ctx.hit({
          path: STANDARD_ROUTE_PATHS.ok,
          appOptions: { hooks },
        });

        expect(beforeDispatch).toHaveBeenCalledTimes(1);
        expect(afterDispatch).toHaveBeenCalledTimes(1);
        expect(beforeDispatch.mock.calls[0][0]).toMatchObject({
          statusCode: 200,
          body: expect.objectContaining({ success: true }),
        });
      });
    });
  },
);
