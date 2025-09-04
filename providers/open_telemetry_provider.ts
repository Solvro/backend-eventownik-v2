import type { Span } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { ClientRequest, IncomingMessage } from "node:http";

import env from "#start/env";

export default class OpenTelemetryProvider {
  async boot() {
    const traceExporter = new OTLPTraceExporter({
      url: `${env.get("SIGNOZ_HOST")}/v1/traces`,
    });

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: "eventownik-backend-adonis",
        [ATTR_SERVICE_VERSION]: "1.0.0",
      }),
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-http": {
            requestHook: (
              span: Span,
              request: IncomingMessage | ClientRequest,
            ) => {
              Object.defineProperty(request, "__otel_span", {
                value: span,
                writable: false,
                enumerable: false,
              });
            },
          },
        }),
      ],
    });

    sdk.start();
  }
}
