import vine from "@vinejs/vine";

export const registerAdminValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(
        async (db, value) =>
          !(await db.from("admins").where("email", value).first()),
      ),
    password: vine.string().minLength(8),
    firstName: vine.string(),
    lastName: vine.string(),
  }),
);

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(),
    rememberMe: vine.boolean().optional(),
  }),
);
