import { DateTime } from "luxon";

import {
  BaseModel,
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

import Event from "#models/event";
import Participant from "#models/participant";
import ParticipantEmail from "#models/participant_email";

export default class Email extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare eventId: number;

  @column()
  declare name: string;

  @column()
  declare content: string;

  @column()
  declare trigger: string;

  @column()
  declare triggerValue: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>;

  // @hasMany(() => ParticipantAttribute)
  // declare attributes: HasMany<typeof ParticipantAttribute>

  @hasMany(() => ParticipantEmail)
  declare participantEmails: HasMany<typeof ParticipantEmail>;

  @manyToMany(() => Participant, {
    pivotTable: "participant_emails",
    pivotColumns: ["send_at", "send_by", "status"],
  })
  declare participants: ManyToMany<typeof Participant>;

  public serializeExtras = true;
}
