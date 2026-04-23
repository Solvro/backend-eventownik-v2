import vine from "@vinejs/vine";

export const participantsStoreValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(async (db, value, field) => {
        const participantEmail = (await db
          .from("participants")
          .select("email", "id")
          .where("email", value)
          .andWhere("event_id", +field.meta.eventId)
          .first()) as { email: string; id: number } | null;

        return participantEmail === null;
      }),
    participantAttributes: vine
      .array(
        vine.object({
          attributeId: vine.number(),
          value: vine.any().transform((value, field) => {
            if (value === null || value === undefined) {
              return null;
            }
            if (typeof value === "string") {
              return value;
            }
            if (typeof value === "number") {
              return String(value);
            }
            if (
              Array.isArray(value) &&
              value.every((v) => typeof v === "string" || typeof v === "number")
            ) {
              return value.map((v) => String(v));
            }
            field.report(
              "Value must be a string, number, null, or an array of these",
              "value",
              field,
            );
          }),
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
        const participant = (await db
          .from("participants")
          .select("id")
          .where("email", value)
          .andWhere("event_id", +field.meta.eventId)
          .first()) as { id: number } | null;

        if (participant === null) {
          return true;
        }

        return participant.id === field.meta.participantId;
      })
      .optional(),
    participantAttributes: vine
      .array(
        vine.object({
          attributeId: vine.number(),
          value: vine
            .any()
            .transform((value, field) => {
              if (value === null || value === undefined) {
                return null;
              }
              if (typeof value === "string") {
                return value;
              }
              if (typeof value === "number") {
                return String(value);
              }
              if (
                Array.isArray(value) &&
                value.every(
                  (v) => typeof v === "string" || typeof v === "number",
                )
              ) {
                return value.map((v) => String(v));
              }
              field.report(
                "Value must be a string, number, null, or an array of these",
                "value",
                field,
              );
            })
            .optional()
            .nullable(),
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
