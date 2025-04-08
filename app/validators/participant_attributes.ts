import vine from "@vinejs/vine";

export const participantBulkUpdateValidator = vine.compile(
  vine.object({
    participantIds: vine.array(
      vine
        .number()
        .exists({ table: "participants", column: "id" })
        .exists({ table: "participant_attributes", column: "participant_id" }),
    ),
    newValue: vine.string(),
  }),
);
