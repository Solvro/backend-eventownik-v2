import { Infer } from "@vinejs/vine/types";

import { adminSchema } from "#validators/admin";

export type AdminCreateDTO = Infer<typeof adminSchema>;
export type AdminUpdateDTO = Partial<AdminCreateDTO>;
