import { buildApp } from "./app";
import { env } from "../infrastructure/config/env";
import { logger } from "../infrastructure/logging/logger";

const app = buildApp();

app.listen(env.appPort, () => {
  logger.info(`Pomelo-BE running on port ${env.appPort}`);
});
