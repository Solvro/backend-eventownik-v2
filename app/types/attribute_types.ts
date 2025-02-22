import { Infer } from "@vinejs/vine/types";

import { createAttributeSchema } from "#validators/attribute";

export type CreateAttributeDTO = Infer<typeof createAttributeSchema> & {
  eventId: number;
};
