import vine from "@vinejs/vine";

export const participantBulkUpdateValidator = vine.compile(
  vine.object({
    id: vine.array(vine.number()),
    attribute_id: vine.number(),
    value: vine.string(),
  }),
);
