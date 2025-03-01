import { Infer } from "@vinejs/vine/types";

import {
  participantsStoreValidator,
  participantsUpdateValidator,
} from "#validators/participants";

export type CreateParticipantDTO = Infer<typeof participantsStoreValidator>;
export type UpdateParticipantDTO = Infer<typeof participantsUpdateValidator>;
