import { context, trace } from "@opentelemetry/api";
import type { Span } from "@opentelemetry/api";

import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

export default class OtelContextMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const rawRequest = ctx.request.request;
    interface RawRequestWithSpan {
      __otel_span?: Span;
    }
    const span = (rawRequest as RawRequestWithSpan).__otel_span;

    if (span === undefined) {
      return next();
    }

    return context.with(trace.setSpan(context.active(), span), () => next());
  }
}
