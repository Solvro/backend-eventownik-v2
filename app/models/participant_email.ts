import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import { DateTime } from "luxon";
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Participant from "#models/participant";
import Email from "#models/email";

export default class ParticipantEmail extends BaseModel {

  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare participantId: number;

  @column()
  declare emailId: number;

  @column.dateTime({ autoCreate: true })
  declare sendAt: DateTime | null;

  @column()
  declare sendBy: string | null;

  @column()
  declare status: 'pending' | 'sent' | 'failed';

  @column.dateTime({ autoCreate: true})
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Participant, {
    foreignKey: 'participantId'
  })
  declare participant: BelongsTo<typeof Participant>;

  @belongsTo(() => Email, {
    foreignKey: 'emailId'
  })
  declare email: BelongsTo<typeof Email>;
}