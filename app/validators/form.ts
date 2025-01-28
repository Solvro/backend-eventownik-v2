import vine from "@vinejs/vine";
import { DateTime } from "luxon";

function DateTimeTransform(value: Date): DateTime {
  const parsed = DateTime.fromISO(value.toISOString())
  if(!parsed.isValid) {
    throw new Error('Invalid date');
  }
  return parsed;
}

export const createFormValidator = vine.compile(
  vine.object({
    isOpen: vine.boolean(),
    description: vine.string(),
    name: vine.string(),
    startDate: vine.date().transform(DateTimeTransform),
    endDate: vine.date().transform(DateTimeTransform).optional(),
    attributeIds: vine.array(vine.number()).optional(),
  }),
);

export const updateFormValidator = vine.compile(
  vine.object({
    isOpen: vine.boolean().optional(),
    description: vine.string().optional(),
    name: vine.string().optional(),
    startDate: vine.date().transform(DateTimeTransform).optional(),
    endDate: vine.date().transform(DateTimeTransform).optional(),
    attributeIds: vine.array(vine.number()).optional(),
  }),
);
