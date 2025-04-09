import vine from "@vinejs/vine";
import { FieldContext } from "@vinejs/vine/types";

import db from "@adonisjs/lucid/services/db";

const checkAttributeId = vine.createRule(
  async (value, _arg, options: FieldContext) => {
    const { meta } = options;
    const attributeId = +meta.attributeId;
    const participantId = Number(value);

    const attribute = await db
      .query()
      .from("participant_attributes")
      .select("id")
      .where("attribute_id", attributeId)
      .andWhere("participant_id", participantId);

    if (attribute.length === 0) {
      options.report(
        `Participant with ID ${participantId} doesn't have attribute of ID ${attributeId}`,
        "checkAttributeId",
        options,
      );
    }
  },
);

export const participantBulkUpdateValidator = vine.compile(
  vine.object({
    participantIds: vine.array(
      vine
        .number()
        .exists({ table: "participants", column: "id" })
        .use(checkAttributeId()),
    ),
    newValue: vine.string(),
  }),
);
