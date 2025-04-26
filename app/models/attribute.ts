import { DateTime } from "luxon";

import {
  BaseModel,
  belongsTo,
  column,
  hasMany,
  hasOne,
  manyToMany,
} from "@adonisjs/lucid/orm";
import type {
  BelongsTo,
  HasMany,
  HasOne,
  ManyToMany,
} from "@adonisjs/lucid/types/relations";

import Block from "#models/block";
import Event from "#models/event";
import Form from "#models/form";

import Participant from "./participant.js";

export default class Attribute extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare slug: string | null;

  @column()
  declare eventId: number;

  @column({ serialize: (value) => JSON.parse(JSON.stringify(value)) })
  declare options: string | null;

  @column()
  declare type: string;

  @column()
  declare showInList: boolean;

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>;

  @manyToMany(() => Form, {
    pivotTable: "form_definitions",
    pivotColumns: ["is_editable", "is_required", "order"],
    pivotTimestamps: true,
  })
  declare forms: ManyToMany<typeof Form>;

  @manyToMany(() => Participant, {
    pivotTable: "participant_attributes",
    pivotColumns: ["value"],
    pivotTimestamps: true,
  })
  declare participantAttributes: ManyToMany<typeof Participant>;

  @hasOne(() => Block, {
    onQuery: (query) => query.where("is_root_block", true),
  })
  declare rootBlock: HasOne<typeof Block>;

  @hasMany(() => Block)
  declare blocks: HasMany<typeof Block>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  public serializeExtras = true;
}
