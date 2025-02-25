import { DateTime } from "luxon";

import {
  BaseModel,
  belongsTo,
  column,
  hasOne,
  manyToMany,
} from "@adonisjs/lucid/orm";
import type {
  BelongsTo,
  HasOne,
  ManyToMany,
} from "@adonisjs/lucid/types/relations";

import Block from "#models/block";
import Event from "#models/event";
import Form from "#models/form";
import ParticipantAttribute from "#models/participant_attribute";

export default class Attribute extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare slug: string | null;

  @column()
  declare eventId: number;

  @column({ serialize: (value) => JSON.parse(value as string) })
  declare options: string | null;

  @column()
  declare type: string;

  @column()
  declare rootBlockId: number | null;

  @column()
  declare showInList: boolean;

  @hasOne(() => Block)
  declare rootBlock: HasOne<typeof Block>;

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>;

  @manyToMany(() => Form, {
    pivotTable: "form_definition",
    pivotColumns: ["is_editable"],
    pivotTimestamps: true,
  })
  declare forms: ManyToMany<typeof Form>;

  @manyToMany(() => ParticipantAttribute, {
    pivotTable: "participant_attribute",
    pivotColumns: ["value"],
  })
  declare participantAttributes: ManyToMany<typeof ParticipantAttribute>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
