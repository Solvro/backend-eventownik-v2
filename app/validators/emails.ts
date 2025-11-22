import vine from "@vinejs/vine";

export const emailsStoreValidator = vine.compile(
  vine.object({
    name: vine.string(),
    content: vine.string(),
    trigger: vine.enum([
      "PARTICIPANT_REGISTERED",
      "PARTICIPANT_DELETED",
      "FORM_FILLED",
      "ATTRIBUTE_CHANGED",
      "MANUAL",
    ]),
    triggerValue: vine
      .string()
      .optional()
      .requiredWhen("trigger", "=", "FORM_FILLED")
      .requiredWhen("trigger", "=", "ATTRIBUTE_CHANGED"),
    triggerValue2: vine
      .string()
      .optional()
      .requiredWhen("trigger", "=", "ATTRIBUTE_CHANGED"),
    formUuid: vine.string().optional(),
  }),
);

export const emailsUpdateValidator = vine.compile(
  vine.object({
    name: vine.string().optional(),
    content: vine.string().optional(),
    trigger: vine
      .enum([
        "PARTICIPANT_REGISTERED",
        "PARTICIPANT_DELETED",
        "FORM_FILLED",
        "ATTRIBUTE_CHANGED",
        "MANUAL",
      ])
      .optional(),
    triggerValue: vine
      .string()
      .optional()
      .requiredWhen("trigger", "=", "FORM_FILLED")
      .requiredWhen("trigger", "=", "ATTRIBUTE_CHANGED"),
    triggerValue2: vine
      .string()
      .optional()
      .requiredWhen("trigger", "=", "ATTRIBUTE_CHANGED"),
    formUuid: vine.string().optional(),
  }),
);

export const emailDuplicateValidator = vine.compile(
  vine.object({
    name: vine.string(),
  }),
);
