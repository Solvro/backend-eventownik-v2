import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

import Event from "#models/event";
import Participant from "#models/participant";

export default class ParticipantAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const slug = ctx.params.participantSlug as string;
    const eventSlug = ctx.params.eventSlug as string;

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

    return next();
  }
}
