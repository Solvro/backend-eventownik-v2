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
    isOpen: vine.boolean(),
    description: vine.string(),
    name: vine.string(),
    startDate: vine.date().transform(dateTimeTransform),
    endDate: vine.date().transform(dateTimeTransform).optional(),
    attributeIds: vine.array(vine.number()).optional(),
  }),
);

export const updateFormValidator = vine.compile(
  vine.object({
    isOpen: vine.boolean().optional(),
    description: vine.string().optional(),
    name: vine.string().optional(),
    startDate: vine.date().transform(dateTimeTransform).optional(),
    endDate: vine.date().transform(dateTimeTransform).optional(),
    attributeIds: vine.array(vine.number()).optional(),
  }),
);
