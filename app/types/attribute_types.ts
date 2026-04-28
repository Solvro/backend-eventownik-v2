import { Infer } from "@vinejs/vine/types";

import {
  bulkAttributeSchema,
  createAttributeSchema,
  updateAttributeSchema,
} from "#validators/attribute";

export type CreateAttributeDTO = Infer<typeof createAttributeSchema> & {
  eventId: number;
};

export type UpdateAttributeDTO = Infer<typeof updateAttributeSchema>;

export type BulkAttributeDTO = Infer<typeof bulkAttributeSchema>;
