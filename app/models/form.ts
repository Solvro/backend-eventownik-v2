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
  declare isFirstForm: boolean;

  @column()
  declare slug: string;

  @column.dateTime({
    serialize: (value: DateTime) => value.toISO({ includeOffset: false }),
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
    pivotTable: "form_definitions",
    pivotColumns: ["is_editable", "is_required", "order"],
    pivotTimestamps: true,
  })
  declare attributes: ManyToMany<typeof Attribute>;

  @beforeCreate()
  static afterSlug(form: Form) {
    form.slug = randomUUID();
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
