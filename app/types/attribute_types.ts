import { Infer } from "@vinejs/vine/types";

import {
  UpdateAttributeSchema,
  bulkAttributeSchema,
  createAttributeSchema,
} from "#validators/attribute";

export type CreateAttributeDTO = Infer<typeof createAttributeSchema> & {
  eventId: number;
};

export type UpdateAttributeDTO = Infer<typeof UpdateAttributeSchema>;

export type BulkAttributeDTO = Infer<typeof bulkAttributeSchema>;
