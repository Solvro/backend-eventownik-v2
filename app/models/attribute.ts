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

import Block from "#models/block";
import Event from "#models/event";
import Form from "#models/form";

import Participant from "./participant.js";

export default class Attribute extends BaseModel {
  @column({ isPrimary: true })
  declare uuid: string;

  @column()
  declare name: string | null;

  @column()
  declare slug: string | null;

  @column()
  declare eventUuid: string;

  @column({ serialize: (value) => JSON.parse(JSON.stringify(value)) })
  declare options: string[] | null;

  @column()
  declare type:
    | "text"
    | "textArea"
    | "number"
    | "file"
    | "select"
    | "block"
    | "date"
    | "time"
    | "datetime"
    | "multiSelect"
    | "email"
    | "tel"
    | "color"
    | "checkbox";

  @column()
  declare showInList: boolean;

  @column()
  declare order: number;

  @column()
  declare isSensitiveData: boolean;

  @column()
  declare reason: string;

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>;

  @manyToMany(() => Form, {
    pivotTable: "FormDefinitions",
    pivotColumns: ["isEditable", "isRequired", "order"],
    pivotTimestamps: true,
  })
  declare forms: ManyToMany<typeof Form>;

  @manyToMany(() => Participant, {
    pivotTable: "ParticipantAttributes",
    pivotColumns: ["value"],
    pivotTimestamps: true,
  })
  declare participantAttributes: ManyToMany<typeof Participant>;

  @belongsTo(() => Block)
  declare rootBlock: BelongsTo<typeof Block>;

  @hasMany(() => Block)
  declare blocks: HasMany<typeof Block>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @beforeCreate()
  static assignUuid(attribute: Attribute) {
    attribute.uuid = randomUUID();
  }

  public serializeExtras = true;
}
