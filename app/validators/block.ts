import vine from "@vinejs/vine";

export const createBlockValidator = vine.compile(
  vine.object({
    name: vine.string().trim(),
    parentId: vine.number().exists({ table: "blocks", column: "id" }),
    description: vine.string().nullable().optional(),
    capacity: vine.number().min(1).nullable().optional(),
  }),
);

export const updateBlockValidator = vine.compile(
  vine.object({
    name: vine.string().trim().optional(),
    parentId: vine
      .number()
      .exists({ table: "blocks", column: "id" })
      .optional(),
    description: vine.string().nullable().optional(),
    capacity: vine.number().min(1).nullable().optional(),
  }),
);
