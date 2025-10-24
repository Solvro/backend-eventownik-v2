import vine from "@vinejs/vine";

export const registerAdminValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(
        async (db, value) =>
          (await db.from("admins").where("email", value).first()) === null,
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

export const sendPasswordResetTokenValidator = vine.compile(
  vine.object({
    email: vine.string().email().exists({ table: "admins", column: "email" }),
  }),
);

export const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string().exists({ table: "password_resets", column: "token" }),
    newPassword: vine.string().minLength(8),
  }),
);
