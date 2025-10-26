import vine from "@vinejs/vine";

export const createAttributeSchema = vine.object({
  name: vine.string(),
  type: vine.enum([
    "text",
    "textArea",
    "number",
    "file",
    "select",
    "block",
    "date",
    "time",
    "datetime",
    "multiSelect",
    "email",
    "tel",
    "color",
    "checkbox",
  ]),
  options: vine.array(vine.string()).minLength(1).nullable().optional(),
  showInList: vine.boolean().optional(),
});

export const createAttributeValidator = vine.compile(createAttributeSchema);

export const UpdateAttributeSchema = vine.object({
  name: vine.string().optional(),
  type: vine
    .enum([
      "text",
      "textArea",
      "number",
      "file",
      "select",
      "block",
      "date",
      "time",
      "datetime",
      "multiSelect",
      "email",
      "tel",
      "color",
      "checkbox",
    ])
    .optional(),
  options: vine.array(vine.string()).minLength(1).nullable().optional(),
  showInList: vine.boolean().optional(),
});

export const updateAttributeValidator = vine.compile(UpdateAttributeSchema);
