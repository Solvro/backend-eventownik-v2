import { DateTime } from "luxon";

import { BaseModel, belongsTo, column, manyToMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, ManyToMany } from "@adonisjs/lucid/types/relations";

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
  declare eventId: number | null;

  @column()
  declare options: object | null;

  @column()
  declare type: string | null;

  @column()
  declare rootBlockId: number | null;

  @column()
  declare showInList: boolean;

  @belongsTo(() => Event, {
    foreignKey: "eventId",
  })
  declare event: BelongsTo<typeof Event>;

  @belongsTo(() => Block, {
    foreignKey: "rootBlockId",
  })
  declare rootBlock: BelongsTo<typeof Block>;

  @manyToMany(() => Form, {
    pivotTable: "form_definition",
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
