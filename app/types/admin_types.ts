import { adminSchema } from "#validators/admin_validators";
import { Infer } from "@vinejs/vine/types";

export type AdminCreateDTO = Infer<typeof adminSchema>;
export type AdminUpdateDTO = Partial<AdminCreateDTO>;
