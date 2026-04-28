import vine from "@vinejs/vine";

import string from "@adonisjs/core/helpers/string";

export const ATTRIBUTE_TYPES = [
  "text",
  "textarea",
  "number",
  "file",
  "select",
  "block",
  "date",
  "time",
  "datetime",
  "multiselect",
  "email",
  "tel",
  "color",
  "checkbox",
  "drawing",
] as const;

export const createAttributeSchema = vine.object({
  name: vine.string(),
  slug: vine
    .string()
    .unique(
      async (db, value, field) =>
        (await db
          .from("attributes")
          .where("slug", string.slug(value, { lower: true }))
          .andWhere("event_id", +field.meta.eventId)
          .first()) === null,
    )
    .transform((value) => string.slug(value, { lower: true }))
    .nullable()
    .optional(),
  type: vine.enum(ATTRIBUTE_TYPES),
  options: vine.array(vine.string()).minLength(1).nullable().optional(),
  isMultiple: vine.boolean().optional(),
  maxSelections: vine.number().min(1).optional(),
  order: vine.number().optional(),
  showInList: vine.boolean().optional(),
  isSensitiveData: vine.boolean().optional(),
  reason: vine.string().optional().requiredWhen("isSensitiveData", "=", true),
  allowOther: vine.boolean().optional(),
});

export const createAttributeValidator = vine.compile(createAttributeSchema);

export const updateAttributeSchema = vine.object({
  name: vine.string().optional(),
  slug: vine
    .string()
    .unique(
      async (db, value, field) =>
        (await db
          .from("attributes")
          .where("slug", string.slug(value, { lower: true }))
          .andWhere("event_id", +field.meta.eventId)
          .andWhereNot("id", +field.meta.attributeId)
          .first()) === null,
    )
    .transform((value) => string.slug(value, { lower: true }))
    .nullable()
    .optional(),
  type: vine.enum(ATTRIBUTE_TYPES).optional(),
  options: vine.array(vine.string()).minLength(1).nullable().optional(),
  isMultiple: vine.boolean().optional(),
  maxSelections: vine.number().min(0).optional(),
  order: vine.number().optional(),
  showInList: vine.boolean().optional(),
  isSensitiveData: vine.boolean().optional(),
  reason: vine.string().optional().requiredWhen("isSensitiveData", "=", true),
  allowOther: vine.boolean().optional(),
});

export const updateAttributeValidator = vine.compile(updateAttributeSchema);

export const bulkAttributeSchema = vine.array(
  vine.object({
    id: vine.number().optional(),
    name: vine.string().optional().requiredIfMissing("id"),
    slug: vine
      .string()
      .unique(async (db, value, field) => {
        const parent = field.parent as { id?: number };
        const itemId = parent.id;
        const query = db
          .from("attributes")
          .where("slug", string.slug(value, { lower: true }))
          .andWhere("event_id", +field.meta.eventId);

        if (itemId !== undefined) {
          void query.andWhereNot("id", itemId);
        }

        const existing = (await query.first()) as unknown;
        return existing === null;
      })
      .transform((value) => string.slug(value, { lower: true }))
      .nullable()
      .optional(),
    type: vine.enum(ATTRIBUTE_TYPES).optional().requiredIfMissing("id"),
    options: vine.array(vine.string()).minLength(1).nullable().optional(),
    isMultiple: vine.boolean().optional(),
    maxSelections: vine.number().min(0).optional(),
    order: vine.number().optional(),
    showInList: vine.boolean().optional(),
    isSensitiveData: vine.boolean().optional(),
    reason: vine.string().optional().requiredWhen("isSensitiveData", "=", true),
    allowOther: vine.boolean().optional(),
  }),
);

export const bulkAttributeValidator = vine.compile(bulkAttributeSchema);
