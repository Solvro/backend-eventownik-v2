import vine from "@vinejs/vine";

export const emailsStoreValidator = vine.compile(
  vine.object({
    name: vine.string(),
    content: vine.string(),
    trigger: vine.enum([
      "participant_registered",
      "participant_deleted",
      "form_filled",
      "attribute_changed",
      "manual",
    ]),
    triggerValue: vine
      .string()
      .optional()
      .requiredWhen("trigger", "=", "form_filled")
      .requiredWhen("trigger", "=", "attribute_changed"),
    triggerValue2: vine
      .string()
      .optional()
      .requiredWhen("trigger", "=", "attribute_changed"),
    formId: vine.number().optional(),
  }),
);

export const emailsUpdateValidator = vine.compile(
  vine.object({
    name: vine.string().optional(),
    content: vine.string().optional(),
    trigger: vine
      .enum([
        "participant_registered",
        "participant_deleted",
        "form_filled",
        "attribute_changed",
        "manual",
      ])
      .optional(),
    triggerValue: vine
      .string()
      .optional()
      .requiredWhen("trigger", "=", "form_filled")
      .requiredWhen("trigger", "=", "attribute_changed"),
    triggerValue2: vine
      .string()
      .optional()
      .requiredWhen("trigger", "=", "attribute_changed"),
    formId: vine.number().optional(),
  }),
);

export const emailDuplicateValidator = vine.compile(
  vine.object({
    name: vine.string(),
  }),
);
