import pino from "pino";
import type { ILogger } from "../../application/contracts/logger";

function createPinoLogger(): ILogger {
  const level = process.env.LOG_LEVEL ?? "info";
  const isDev = process.env.NODE_ENV !== "production";

  const base = pino({
    level,
    ...(isDev && {
      transport: { target: "pino-pretty", options: { colorize: true } }
    })
  });

  return {
    info: (msg, data) => base.info(data ?? {}, msg),
    warn: (msg, data) => base.warn(data ?? {}, msg),
    error: (msg, data) => base.error(data ?? {}, msg),
    debug: (msg, data) => base.debug(data ?? {}, msg)
  };
}

export const logger: ILogger = createPinoLogger();
