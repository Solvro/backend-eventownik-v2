import { Infer } from "@vinejs/vine/types";

import { adminSchema } from "#validators/admin_validators";

export type AdminCreateDTO = Infer<typeof adminSchema>;
export type AdminUpdateDTO = Partial<AdminCreateDTO>;
