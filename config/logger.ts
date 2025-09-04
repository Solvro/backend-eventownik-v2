import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

import { defineConfig, targets } from "@adonisjs/core/logger";
import app from "@adonisjs/core/services/app";

import env from "#start/env";

const loggerConfig = defineConfig({
  default: "app",

  /**
   * The loggers object can be used to define multiple loggers.
   * By default, we configure only one logger (named "app").
   */
  loggers: {
    app: {
      enabled: true,
      name: env.get("APP_NAME"),
      level: env.get("LOG_LEVEL"),
      transport: {
        targets: targets()
          .push({
            target: "pino-opentelemetry-transport",
            options: {
              logRecordProcessorOptions: {
                exporterOptions: {
                  url: `${env.get("SIGNOZ_HOST")}/v1/logs`,
                },
              },
              resourceAttributes: {
                [ATTR_SERVICE_NAME]: "eventownik-backend-adonis",
                [ATTR_SERVICE_VERSION]: "1.0.0",
              },
            },
            level: env.get("LOG_LEVEL"),
          })
          .pushIf(!app.inProduction, targets.pretty())
          .pushIf(app.inProduction, targets.file({ destination: 1 }))
          .toArray(),
      },
    },
  },
});

export default loggerConfig;

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module "@adonisjs/core/types" {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
