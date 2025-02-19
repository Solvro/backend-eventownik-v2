import Event from "#models/event";
import Participant from "#models/participant";
import { BaseModel, belongsTo, column, manyToMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, ManyToMany } from "@adonisjs/lucid/types/relations";
import { DateTime } from "luxon";

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

  @manyToMany(() => Participant, {
    pivotTable: "participant_emails",
    pivotColumns: ["send_at", "send_by", "status"],
  })
  declare participants: ManyToMany<typeof Participant>;
}
