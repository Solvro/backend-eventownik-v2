import { DateTime } from "luxon";

import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";

import Attribute from "#models/attribute";
import Participant from "#models/participant";

export default class ParticipantAttribute extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare participantId: number;

  @column()
  declare attributeId: number;

  @column()
  declare value: string | null;

  @belongsTo(() => Participant, {
    foreignKey: "participantId",
  })
  declare participant: BelongsTo<typeof Participant>;

  @belongsTo(() => Attribute, {
    foreignKey: "attributeId",
  })
  declare attribute: BelongsTo<typeof Attribute>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  serializeExtras = true;
}
