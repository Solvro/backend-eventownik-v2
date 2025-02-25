import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

import Event from "#models/event";
import Participant from "#models/participant";

export default class ParticipantAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Middleware logic goes here (before the next call)
     */
    // console.log(ctx)

    const slug = ctx.params.participantSlug;
    const eventSlug = ctx.params.eventSlug;

    const event = await Event.findBy("slug", eventSlug);

    if (event === null) {
      return ctx.response.unauthorized({
        errors: [{ message: "Unauthorized access" }],
      });
    }

    const participant = await Participant.query()
      .where("slug", slug)
      .where("event_id", event.id)
      .first();

    if (participant === null) {
      return ctx.response.unauthorized({
        errors: [{ message: "Unauthorized access" }],
      });
    }

    ctx.event = event;
    ctx.participant = participant;

    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next();
    return output;
  }
}
