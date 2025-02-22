import { Infer } from "@vinejs/vine/types";

import {
  UpdateAttributeSchema,
  createAttributeSchema,
} from "#validators/attribute";

export type CreateAttributeDTO = Infer<typeof createAttributeSchema> & {
  eventId: number;
};

export type UpdateAttributeDTO = Infer<typeof UpdateAttributeSchema>;
