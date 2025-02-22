import { DateTime } from "luxon";

import { BaseModel, belongsTo, column, manyToMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, ManyToMany } from "@adonisjs/lucid/types/relations";

import Event from "#models/event";

import Attribute from "./attribute.js";

export default class Form extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare eventId: number;

  @column()
  declare isOpen: boolean;

  @column()
  declare description: string;

  @column()
  declare name: string;

  @column()
  declare slug: string;

  @column.dateTime()
  declare startDate: DateTime;

  @column.dateTime()
  declare endDate: DateTime | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>;

  @manyToMany(() => Attribute, {
    pivotTable: "form_definitions",
    pivotColumns: ["is_editable"],
    pivotTimestamps: true,
  })
  declare attributes: ManyToMany<typeof Attribute>;
}
