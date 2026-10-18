import express, { type Express } from "express";
import { BarExpressAdapter } from "../../src/adapters/express";
import { mountStandardRoutesExpress } from "../shared/register-standard-routes";
import { silentLogger } from "../shared/silent-logger";
import type { TestAppOptions } from "../shared/types";

export type ExpressTestApp = Express;

export function createExpressTestApp(
  options: TestAppOptions = {},
): ExpressTestApp {
  const app = express();
  app.use(express.json());

  const bar = new BarExpressAdapter({
    withDefaultHeaders: options.withDefaultHeaders ?? true,
    logger: silentLogger,
    hooks: options.hooks,
    environment: options.environment ?? "development",
  });

  app.use(bar.handler());
  mountStandardRoutesExpress(app);

  return app;
}
