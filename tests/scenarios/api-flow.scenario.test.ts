import express from "express";
import cookie from "@fastify/cookie";
import Fastify from "fastify";
import { BarExpressAdapter } from "../../src/adapters/express";
import { registerBarFastify } from "../../src/adapters/fastify";
import { hitExpress } from "../clients/express.client";
import { hitFastify } from "../clients/fastify.client";
import { assertBarResponse } from "../shared/assert-bar-response";
import { silentLogger } from "../shared/silent-logger";
import type { HttpRequestBody } from "../shared/http-request.types";
import type { AdapterName, TestAppOptions } from "../shared/types";
import {
  createOrderStore,
  mountOrderApiExpress,
  mountOrderApiFastify,
  ORDER_API_PATHS,
} from "./fixtures/order-api.routes";

async function createOrderFlowApp(
  adapter: AdapterName,
  options: TestAppOptions = {},
) {
  const store = createOrderStore();

  if (adapter === "express") {
    const app = express();
    app.use(express.json());
    app.use(
      new BarExpressAdapter({
        logger: silentLogger,
        environment: options.environment ?? "development",
      }).handler(),
    );
    mountOrderApiExpress(app, { store });
    return {
      store,
      hit: (
        path: string,
        init?: { method?: "GET" | "POST"; body?: HttpRequestBody },
      ) =>
        hitExpress(app, {
          path,
          method: init?.method,
          body: init?.body,
        }),
      teardown: async () => {},
    };
  }

  const app = Fastify();
  await app.register(cookie);
  registerBarFastify(app, {
    logger: silentLogger,
    environment: options.environment ?? "development",
  });
  mountOrderApiFastify(app, { store });
  await app.ready();

  return {
    store,
    hit: (
      path: string,
      init?: { method?: "GET" | "POST"; body?: HttpRequestBody },
    ) =>
      hitFastify(app, {
        path,
        method: init?.method,
        body: init?.body,
      }),
    teardown: async () => {
      await app.close();
    },
  };
}

describe.each<AdapterName>(["express", "fastify"])(
  "Order API flow scenario (%s)",
  (adapter) => {
    afterEach(async () => {
      // each test creates its own app; teardown handled in test body
    });

    it("çok adımlı sipariş akışı ve wrap prod güvenliği", async () => {
      const flow = await createOrderFlowApp(adapter);

      try {
        const health = await flow.hit(ORDER_API_PATHS.health);
        assertBarResponse(health, {
          status: 200,
          bodyPartial: {
            success: true,
            data: { status: "up" },
          },
        });

        const emptyOrder = await flow.hit(ORDER_API_PATHS.orders, {
          method: "POST",
          body: { items: [] },
        });
        assertBarResponse(emptyOrder, {
          status: 400,
          bodyPartial: {
            success: false,
            error: {
              code: "BAD_REQUEST",
              message: "Order must include at least one item",
            },
          },
        });

        const created = await flow.hit(ORDER_API_PATHS.orders, {
          method: "POST",
          body: { items: ["widget-a"] },
        });
        assertBarResponse(created, {
          status: 201,
          bodyPartial: {
            success: true,
            message: "Order created",
          },
          bodyAssert: (body) => {
            const data = body.data as { id: string; items: string[] };
            expect(data.id).toMatch(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            );
            expect(data.items).toEqual(["widget-a"]);
          },
        });

        const orderId = (created.body!.data as { id: string }).id;

        const fetched = await flow.hit(ORDER_API_PATHS.orderById(orderId));
        assertBarResponse(fetched, {
          status: 200,
          bodyPartial: {
            success: true,
            data: { id: orderId, items: ["widget-a"] },
          },
        });

        const missing = await flow.hit(
          ORDER_API_PATHS.orderById("00000000-0000-4000-8000-000000000000"),
        );
        assertBarResponse(missing, {
          status: 404,
          bodyPartial: {
            success: false,
            error: { code: "NOT_FOUND", message: "Order not found" },
          },
        });

        const devFail = await flow.hit(ORDER_API_PATHS.orderFail);
        assertBarResponse(devFail, {
          status: 500,
          bodyPartial: { success: false },
        });
        const devError = devFail.body?.error as { message?: string } | undefined;
        expect(String(devError?.message)).toContain("Payment gateway");

        await flow.teardown();
        const prodFlow = await createOrderFlowApp(adapter, {
          environment: "production",
        });

        const prodFail = await prodFlow.hit(ORDER_API_PATHS.orderFail);
        assertBarResponse(prodFail, {
          status: 500,
          bodyPartial: {
            error: { message: "Internal Server Error" },
          },
          messageMustNotContain: "Payment gateway",
        });

        await prodFlow.teardown();
      } finally {
        await flow.teardown();
      }
    });
  },
);
