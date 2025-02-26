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
    attributes: vine
      .array(
        vine.object({
          id: vine.number(),
          isRequired: vine.boolean().optional(),
          isEditable: vine.boolean().optional(),
        }),
      )
      .minLength(1),
    endDate: vine.date().transform(dateTimeTransform).optional(),
    isOpen: vine.boolean().optional(),
    isFirstForm: vine.boolean(),
  }),
);

export const updateFormValidator = vine.compile(
  vine.object({
    name: vine.string().optional(),
    description: vine.string().optional(),
    startDate: vine.date().transform(dateTimeTransform).optional(),
    endDate: vine.date().transform(dateTimeTransform).optional(),
    attributes: vine
      .array(
        vine.object({
          id: vine.number(),
          isRequired: vine.boolean().optional(),
          isEditable: vine.boolean().optional(),
        }),
      )
      .minLength(1)
      .optional(),
    isOpen: vine.boolean().optional(),
    isFirstForm: vine.boolean(),
  }),
);

export const filledFieldsValidator = vine.compile(
  vine.object({
    filledFields: vine.object({
      field1: vine.any().optional(),
      field2: vine.any().optional(),
    }),
  }),
);
