import vine from "@vinejs/vine";
import { FieldContext } from "@vinejs/vine/types";

import db from "@adonisjs/lucid/services/db";

const checkParticipantExists = vine.createRule(
  async (value, _arg, field: FieldContext) => {
    const participantIds = Array.isArray(value)
      ? (value as string[])
      : [value as string];
    const foundParticipants = await db
      .from("participants")
      .select("uuid")
      .whereIn("uuid", participantIds)
      .andWhere("eventUuid", String(field.meta.eventId));
    const foundParticipantIds = foundParticipants.map(
      (participant: { uuid: string }) => participant.uuid,
    );
    const notFoundParticipantsIds = participantIds.filter(
      (participantId) => !foundParticipantIds.includes(participantId),
    );
    for (const participantId of notFoundParticipantsIds) {
      field.report(
        `Participant with ID ${participantId} does not exist.`,
        "exists",
        field,
      );
    }
  },
);

export const participantBulkUpdateValidator = vine.compile(
  vine.object({
    participantIds: vine.array(vine.number()).use(checkParticipantExists()),
    newValue: vine.string(),
  }),
);
