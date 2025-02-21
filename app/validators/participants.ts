import vine from "@vinejs/vine";

export const participantsStoreValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    eventId: vine.number().optional(),
    firstName: vine.string(),
    lastName: vine.string(),
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
    firstName: vine.string().optional(),
    lastName: vine.string().optional(),
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
