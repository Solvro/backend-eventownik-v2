import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";

import {
  BaseModel,
  beforeCreate,
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

import Event from "#models/event";

import Attribute from "./attribute.js";

export default class Form extends BaseModel {
  @column({ isPrimary: true })
  declare uuid: string;

  @column()
  declare eventUuid: string;

  @column()
  declare isEditable: boolean;

  @column()
  declare description: string;

  @column()
  declare name: string;

  @column.dateTime({
    serialize: (value: DateTime | null) => {
      return value !== null ? value.toISO({ includeOffset: false }) : value;
    },
  })
  declare openDate: DateTime;

  @column.dateTime({
    serialize: (value: DateTime | null) => {
      return value !== null ? value.toISO({ includeOffset: false }) : value;
    },
  })
  declare closeDate: DateTime;

  @column.dateTime({
    serialize: (value: DateTime | null) => {
      return value !== null ? value.toISO({ includeOffset: false }) : value;
    },
  })
  declare startDate: DateTime;

  @column.dateTime({
    serialize: (value: DateTime | null) => {
      return value !== null ? value.toISO({ includeOffset: false }) : value;
    },
  })
  declare endDate: DateTime | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Event)
  declare event: BelongsTo<typeof Event>;

  @manyToMany(() => Attribute, {
    pivotTable: "FormsDefinitions",
    pivotColumns: ["isRequired", "order"],
    pivotTimestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  })
  declare attributes: ManyToMany<typeof Attribute>;

  @hasOne(() => Event, {
    foreignKey: "firstFormUuid",
  })
  declare registerEvent: HasOne<typeof Event>;

  @beforeCreate()
  static assignUuid(form: Form) {
    form.uuid = randomUUID();
  }

  serializeExtras() {
    return {
      attributes: this.attributes.map((attribute) => ({
        ...attribute.toJSON(),
        isEditable: (attribute.$extras as { pivot_is_editable: boolean })
          .pivot_is_editable,
        isRequired: (attribute.$extras as { pivot_is_required: boolean })
          .pivot_is_required,
        order: (attribute.$extras as { pivot_order: number }).pivot_order,
      })),
    };
  }
}
