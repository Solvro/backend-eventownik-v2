import vine from "@vinejs/vine";

export const participantsStoreValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .exists(async (db, value, field) => {
        const participantEmail = (await db
          .from("participants")
          .select("email")
          .where("email", value)
          .andWhere("event_id", +field.meta.eventId)
          .first()) as { email: string } | null;

        return participantEmail === null;
      }),
    participantAttributes: vine
      .array(
        vine.object({
          attributeId: vine.number(),
          value: vine.string().nullable(),
        }),
      )
      .optional(),
  }),
);

export const participantsUpdateValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .exists(async (db, value, field) => {
        const participantEmail = (await db
          .from("participants")
          .select("email")
          .where("email", value)
          .andWhere("event_id", +field.meta.eventId)
          .first()) as { email: string } | null;

        return participantEmail === null;
      })
      .optional(),
    participantAttributes: vine
      .array(
        vine.object({
          attributeId: vine.number(),
          value: vine.string().nullable(),
        }),
      )
      .optional(),
  }),
);

export const unregisterManyParticipantsValidator = vine.compile(
  vine.object({
    participantsToUnregisterIds: vine.array(vine.number()).minLength(1),
  }),
);
