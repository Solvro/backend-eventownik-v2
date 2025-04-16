import vine from "@vinejs/vine";
import { FieldContext } from "@vinejs/vine/types";

import db from "@adonisjs/lucid/services/db";

const checkParticipantExists = vine.createRule(
  async (value, _arg, field: FieldContext) => {
    const participantIds = Array.isArray(value)
      ? (value as number[])
      : [value as number];
    return await db
      .from("participants")
      .select("id")
      .whereIn("id", participantIds)
      .andWhere("event_id", +field.meta.eventId)
      .then((row: { id: number }[]) => {
        const foundParticipants = row.map((participant) => participant.id);
        const notFoundParticipants = participantIds.filter(
          (participantId) => !foundParticipants.includes(participantId),
        );
        for (const participantId of notFoundParticipants) {
          field.report(
            `Participant with ID don't ${participantId} exists`,
            "exists",
            field,
          );
        }
      });
  },
);

export const participantBulkUpdateValidator = vine.compile(
  vine.object({
    participantIds: vine
      .array(vine.number())

      .use(checkParticipantExists()),
    newValue: vine.string(),
  }),
);
