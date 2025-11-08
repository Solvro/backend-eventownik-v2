import { Infer } from "@vinejs/vine/types";

import {
  UpdateAttributeSchema,
  createAttributeSchema,
} from "#validators/attribute";

export type CreateAttributeDTO = Infer<typeof createAttributeSchema> & {
  eventUuid: string;
};

export type UpdateAttributeDTO = Infer<typeof UpdateAttributeSchema>;
