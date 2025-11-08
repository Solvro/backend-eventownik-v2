import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";

import {
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
  manyToMany,
} from "@adonisjs/lucid/orm";
import type { BelongsTo, ManyToMany } from "@adonisjs/lucid/types/relations";

import Event from "#models/event";
import Form from "#models/form";
import Participant from "#models/participant";

export default class Email extends BaseModel {
  @column({ isPrimary: true })
  declare uuid: string;

  @column()
  declare eventUuid: string;

  @column()
  declare name: string;

  @column()
  declare content: string;

  @column()
  declare trigger: string;

  @column()
  declare triggerValue?: string | null;

  @column()
  declare triggerValue2?: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>;

  @column()
  declare formUuid?: string | null;

  @belongsTo(() => Form)
  declare form: BelongsTo<typeof Form>;

  @manyToMany(() => Participant, {
    pivotTable: "ParticipantEmails",
    pivotColumns: ["sendAt", "sendBy", "status"],
  })
  declare participants: ManyToMany<typeof Participant>;

  @beforeCreate()
  static assignUuid(email: Email) {
    email.uuid = randomUUID();
  }

  serializeExtras = true;
}
