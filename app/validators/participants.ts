import vine from "@vinejs/vine";

export const participantsStoreValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(async (db, value, field) => {
        const participantEmail = (await db
          .from("Participants")
          .select("email", "uuid")
          .where("email", value)
          .andWhere("eventUuid", field.meta.eventId as string)
          .first()) as { email: string } | null;
        return participantEmail === null;
      }),
    participantAttributes: vine
      .array(
        vine.object({
          attributeUUID: vine.string().uuid(),
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
      .unique(async (db, value, field) => {
        const participantEmail = (await db
          .from("participants")
          .select("email", "uuid")
          .where("email", value)
          .andWhere("eventUuid", String(field.meta.eventId))
          .first()) as { email: string; uuid: string } | null;
        if (
          participantEmail !== null &&
          participantEmail.uuid === field.meta.participantId
        ) {
          return true;
        }
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
