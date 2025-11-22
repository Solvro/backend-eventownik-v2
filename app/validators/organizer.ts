import vine from "@vinejs/vine";

export const addOrganizerValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    permissionsUuids: vine.array(
      vine.string().exists({ table: "Permissions", column: "uuid" }),
    ),
    firstName: vine.string().optional(),
    lastName: vine.string().optional(),
    password: vine.string().optional(),
  }),
);

export const updateOrganizerPermissionsValidator = vine.compile(
  vine.object({
    permissionsUuids: vine.array(
      vine.string().exists({ table: "Permissions", column: "uuid" }),
    ),
  }),
);
