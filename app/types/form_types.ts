import { Infer } from "@vinejs/vine/types";

import { formSubmitValidator } from "#validators/form";

export type FormSubmitDTO = Infer<typeof formSubmitValidator>;
