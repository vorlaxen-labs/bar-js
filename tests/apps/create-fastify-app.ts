import cookie from "@fastify/cookie";
import Fastify, { type FastifyInstance } from "fastify";
import { registerBarFastify } from "../../src/adapters/fastify";
import { mountStandardRoutesFastify } from "../shared/register-standard-routes";
import { silentLogger } from "../shared/silent-logger";
import type { TestAppOptions } from "../shared/types";

export async function createFastifyTestApp(
  options: TestAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify();

  await app.register(cookie);
  registerBarFastify(app, {
    withDefaultHeaders: options.withDefaultHeaders ?? true,
    logger: silentLogger,
    hooks: options.hooks,
    environment: options.environment ?? "development",
  });

  mountStandardRoutesFastify(app);
  await app.ready();

  return app;
}
