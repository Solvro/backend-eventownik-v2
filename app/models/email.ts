import { DateTime } from "luxon";

import { BaseModel, belongsTo, column, manyToMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, ManyToMany } from "@adonisjs/lucid/types/relations";

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
    pivotTable: "participantEmails",
    pivotColumns: ["send_at", "send_by", "status"],
  })
  declare participants: ManyToMany<typeof Participant>;

  public $extras: {
    pending_count: number;
    sent_count: number;
    failed_count: number;
  } = {
    pending_count: 0,
    sent_count: 0,
    failed_count: 0,
  };
}
