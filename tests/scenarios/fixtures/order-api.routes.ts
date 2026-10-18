import type { Express, Request, Response } from "express";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export type OrderRecord = {
  id: string;
  items: string[];
};

export function createOrderStore(): Map<string, OrderRecord> {
  return new Map();
}

export const ORDER_API_PATHS = {
  health: "/health",
  orders: "/orders",
  orderById: (id: string) => `/orders/${id}`,
  orderFail: "/orders/fail-async",
} as const;

type OrderApiDeps = {
  store: Map<string, OrderRecord>;
};

type CreateOrderBody = {
  items?: string[];
};

export function mountOrderApiExpress(app: Express, deps: OrderApiDeps): void {
  const { store } = deps;

  app.get(ORDER_API_PATHS.health, (_req: Request, res: Response) =>
    res.builder.as.ok({ status: "up" }, "Healthy").build(),
  );

  app.post(ORDER_API_PATHS.orders, (req: Request, res: Response) => {
    const body = req.body as CreateOrderBody | undefined;
    const items = body?.items;

    if (!items?.length) {
      return res.builder.as
        .badRequest("Order must include at least one item")
        .build();
    }

    const id = crypto.randomUUID();
    store.set(id, { id, items });
    return res.builder.as.created({ id, items }, "Order created").build();
  });

  app.get(ORDER_API_PATHS.orderFail, async (_req: Request, res: Response) => {
    await res.builder.wrap(
      Promise.reject(new Error("Payment gateway timeout detail")),
    );
    return res.builder.build();
  });

  app.get("/orders/:id", (req: Request<{ id: string }>, res: Response) => {
    const id = req.params.id;
    const order = store.get(id);
    if (!order) {
      return res.builder.as.notFound("Order not found").build();
    }
    return res.builder.as.ok(order, "Order fetched").build();
  });
}

export function mountOrderApiFastify(
  app: FastifyInstance,
  deps: OrderApiDeps,
): void {
  const { store } = deps;

  app.get(ORDER_API_PATHS.health, async (_request: FastifyRequest, reply: FastifyReply) =>
    reply.builder.as.ok({ status: "up" }, "Healthy").build(),
  );

  app.post<{ Body: CreateOrderBody }>(
    ORDER_API_PATHS.orders,
    async (request, reply) => {
      const items = request.body?.items;

      if (!items?.length) {
        return reply.builder.as
          .badRequest("Order must include at least one item")
          .build();
      }

      const id = crypto.randomUUID();
      store.set(id, { id, items });
      return reply.builder.as.created({ id, items }, "Order created").build();
    },
  );

  app.get(ORDER_API_PATHS.orderFail, async (_request: FastifyRequest, reply: FastifyReply) => {
    await reply.builder.wrap(
      Promise.reject(new Error("Payment gateway timeout detail")),
    );
    return reply.builder.build();
  });

  app.get<{ Params: { id: string } }>(
    "/orders/:id",
    async (request, reply) => {
      const order = store.get(request.params.id);
      if (!order) {
        return reply.builder.as.notFound("Order not found").build();
      }
      return reply.builder.as.ok(order, "Order fetched").build();
    },
  );
}
