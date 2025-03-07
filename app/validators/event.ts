import vine from "@vinejs/vine";
import { DateTime } from "luxon";

import string from "@adonisjs/core/helpers/string";

function dateTimeTransform(value: Date): DateTime {
  const parsed = DateTime.fromISO(value.toISOString());
  if (!parsed.isValid) {
    throw new Error("Invalid date");
  }
  return parsed;
}

export const createEventValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(255),
    description: vine.string().nullable().optional(),
    organizer: vine.string().nullable().optional(),
    slug: vine
      .string()
      .unique(
        async (db, value) =>
          (await db
            .from("events")
            .where("slug", string.slug(value, { lower: true }))
            .first()) === null,
      )
      .transform((value) => string.slug(value, { lower: true })),
    // 2025-01-05 12:00:00
    startDate: vine.date().transform(dateTimeTransform),
    endDate: vine.date().transform(dateTimeTransform),
    lat: vine.number().nullable().optional(),
    long: vine.number().nullable().optional(),
    primaryColor: vine.string().nullable().optional(),
    participantsCount: vine.number().nullable().optional(),
    photo: vine
      .file({
        size: "10mb",
        extnames: ["jpg", "jpeg", "png", "gif"],
      })
      .optional(),
    socialMediaLinks: vine
      .array(
        vine.string().normalizeUrl({
          normalizeProtocol: true,
          forceHttps: true,
          stripWWW: false,
          removeExplicitPort: true,
        }),
      )
      .nullable()
      .optional(),
  }),
);

export const updateEventValidator = vine.compile(
  vine.object({
    name: vine.string().maxLength(255).optional(),
    description: vine.string().nullable().optional(),
    slug: vine
      .string()
      .unique(
        async (db, value) =>
          (await db
            .from("events")
            .where("slug", string.slug(value, { lower: true }))
            .first()) === null,
      )
      .transform((value) => string.slug(value, { lower: true }))
      .optional(),
    startDate: vine.date().transform(dateTimeTransform).optional(),
    endDate: vine.date().transform(dateTimeTransform).optional(),
    lat: vine.number().nullable().optional(),
    long: vine.number().nullable().optional(),
    primaryColor: vine.string().nullable().optional(),
    participantsCount: vine.number().nullable().optional(),
    organizer: vine.string().nullable().optional(),
    photo: vine
      .file({
        size: "10mb",
        extnames: ["jpg", "jpeg", "png", "git"],
      })
      .nullable()
      .optional(),
    socialMediaLinks: vine
      .array(
        vine.string().normalizeUrl({
          normalizeProtocol: true,
          forceHttps: true,
          stripWWW: false,
          removeExplicitPort: true,
        }),
      )
      .nullable()
      .optional(),
  }),
);
