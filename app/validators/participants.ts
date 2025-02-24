import vine from "@vinejs/vine";

export const participantsStoreValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    eventId: vine.number().optional(),
    participantAttributes: vine
      .array(
        vine.object({
          attributeId: vine.number(),
          value: vine.string(),
        }),
      )
      .optional(),
  }),
);

export const participantsUpdateValidator = vine.compile(
  vine.object({
    email: vine.string().email().optional(),
    eventId: vine.number().optional(),
    participantAttributes: vine
      .array(
        vine.object({
          id: vine.number(),
          value: vine.string(),
        }),
      )
      .optional(),
  }),
);
