import vine from "@vinejs/vine";

export const createPermissionValidator = vine.compile(
  vine.object({
    action: vine.string(),
    subject: vine.string(),
  }),
);

export const updatePermissionValidator = vine.compile(
  vine.object({
    action: vine.string().optional(),
    subject: vine.string().optional(),
  }),
);
