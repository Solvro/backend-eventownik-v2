import { DateTime } from "luxon";

import { BaseModel, belongsTo, column, manyToMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, ManyToMany } from "@adonisjs/lucid/types/relations";

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
  declare firstName: string;

  @column()
  declare lastName: string;

  @column()
  declare slug: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>;

  @manyToMany(() => Email, {
    pivotTable: "participant_emails",
    pivotColumns: ["send_at", "send_by", "status"],
  })
  declare emails: ManyToMany<typeof Email>;

  @hasMany(() => ParticipantAttribute)
  declare participant_attributes: HasMany<typeof ParticipantAttribute>;

  @hasMany(() => ParticipantEmail)
  declare participant_emails: HasMany<typeof ParticipantEmail>;

  @beforeCreate()
  static async generateSlug(participant: Participant) {
    participant.slug = v4();
  }
}
