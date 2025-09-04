import type { Span } from "@opentelemetry/api";

import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

export default class OpenTelemetryMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const rawRequest = ctx.request.request;
    interface RawRequestWithSpan {
      __otel_span?: Span;
    }
    const span = (rawRequest as RawRequestWithSpan).__otel_span;
    if (span !== undefined) {
      const requestId = ctx.request.id();
      if (requestId !== undefined) {
        span.setAttribute("http.request_id", requestId);
      }
    }
    await next();
  }
}
