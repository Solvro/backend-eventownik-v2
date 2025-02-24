import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";

import {
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
  hasMany,
  manyToMany,
} from "@adonisjs/lucid/orm";
import type {
  BelongsTo,
  HasMany,
  ManyToMany,
} from "@adonisjs/lucid/types/relations";

import Email from "#models/email";
import Event from "#models/event";
import ParticipantAttribute from "#models/participant_attribute";
import ParticipantEmail from "#models/participant_email";

export default class Participant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare email: string;

  @column()
  declare eventId: number;

  @column()
  declare slug: string;

  @column.dateTime({
    autoCreate: true,
    serialize: (value: DateTime) => value.toFormat("yyyy-MM-dd HH:mm:ss"),
  })
  declare createdAt: DateTime;

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    serialize: (value: DateTime) => value.toFormat("yyyy-MM-dd HH:mm:ss"),
  })
  declare updatedAt: DateTime;

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>;

  @manyToMany(() => Email, {
    pivotTable: "participant_emails",
    pivotColumns: ["send_at", "send_by", "status"],
  })
  declare emails: ManyToMany<typeof Email>;

  @hasMany(() => ParticipantAttribute)
  declare participantAttributes: HasMany<typeof ParticipantAttribute>;

  @hasMany(() => ParticipantEmail)
  declare participantEmails: HasMany<typeof ParticipantEmail>;

  @beforeCreate()
  static async generateSlug(participant: Participant) {
    participant.slug = randomUUID();
  }

  serializeExtras = true;
}
