import vine from "@vinejs/vine";

export const participantBulkUpdateValidator = vine.compile(
  vine.object({
    participantIds: vine.array(
      vine.number().exists(async (db, value: number, field) => {
        return await db
          .from("participants")
          .where("id", value)
          .andWhere("event_id", +field.meta.eventId)
          .first()
          .then(Boolean);
      }),
    ),
    newValue: vine.string(),
  }),
);
