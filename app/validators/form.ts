import vine from "@vinejs/vine";
import { DateTime } from "luxon";

function dateTimeTransform(value: Date): DateTime {
  const parsed = DateTime.fromISO(value.toISOString());
  if (!parsed.isValid) {
    throw new Error("Invalid date");
  }
  return parsed;
}

export const createFormValidator = vine.compile(
  vine.object({
    name: vine.string(),
    description: vine.string(),
    startDate: vine.date().transform(dateTimeTransform),
    attributesIds: vine.array(vine.number()).minLength(1),
    endDate: vine.date().transform(dateTimeTransform).optional(),
    isOpen: vine.boolean().optional(),
  }),
);

export const updateFormValidator = vine.compile(
  vine.object({
    name: vine.string().optional(),
    description: vine.string().optional(),
    startDate: vine.date().transform(dateTimeTransform).optional(),
    endDate: vine.date().transform(dateTimeTransform).optional(),
    attributesIds: vine.array(vine.number()).minLength(1).optional(),
    isOpen: vine.boolean().optional(),
  }),
);
