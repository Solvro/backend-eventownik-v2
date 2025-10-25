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

import Email from "#models/email";
import Event from "#models/event";

import Attribute from "./attribute.js";

export default class Participant extends BaseModel {
  @column({ isPrimary: true })
  declare uuid: string;

  @column()
  declare email: string;

  @column()
  declare eventUuid: string;

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

  @manyToMany(() => Attribute, {
    pivotTable: "ParticipantsAttributes",
    pivotColumns: ["value"],
    pivotTimestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  })
  declare attributes: ManyToMany<typeof Attribute>;

  @manyToMany(() => Email, {
    pivotTable: "ParticipantsEmails",
    pivotColumns: ["sendAt", "sendBy", "status"],
    pivotTimestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  })
  declare emails: ManyToMany<typeof Email>;

  @beforeCreate()
  static assignUuid(participant: Participant) {
    participant.uuid = randomUUID();
  }

  serializeExtras = true;
}
