import { DateTime } from "luxon";

import {
  BaseModel,
  beforeCreate,
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

import Email from "#models/email";
import Form from "#models/form";

import Admin from "./admin.js";
import Attribute from "./attribute.js";
import Participant from "./participant.js";
import Permission from "./permission.js";

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare organizerId: number;

  @column()
  declare name: string;

  @column()
  declare description: string | null;

  @column()
  declare slug: string;

  @column.dateTime({
    serialize: (value: DateTime) => value.toISO({ includeOffset: false }),
  })
  declare startDate: DateTime;

  @column.dateTime({
    serialize: (value: DateTime) => value.toISO({ includeOffset: false }),
  })
  declare endDate: DateTime;

  @column()
  declare lat: number | null;

  @column()
  declare long: number | null;

  @column()
  declare primaryColor: string | null;

  @column()
  declare contactEmail: string | null;

  @column()
  declare organizer: string | null;

  @column()
  declare participantsCount: number | null;

  @column()
  declare location: string | null;

  @column()
  declare isActive: boolean;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @column()
  declare photoUrl: string | null;

  @manyToMany(() => Admin, {
    pivotTable: "admin_permissions",
    pivotColumns: ["permission_id"],
    pivotTimestamps: true,
  })
  declare admins: ManyToMany<typeof Admin>;

  @belongsTo(() => Admin, {
    foreignKey: "organizerId",
  })
  declare mainOrganizer: BelongsTo<typeof Admin>;

  @manyToMany(() => Permission, {
    pivotTable: "admin_permissions",
    pivotColumns: ["admin_id"],
    pivotTimestamps: true,
  })
  declare permissions: ManyToMany<typeof Permission>;

  @hasMany(() => Participant)
  declare participants: HasMany<typeof Participant>;

  @hasMany(() => Email)
  declare emails: HasMany<typeof Email>;

  @hasMany(() => Form)
  declare forms: HasMany<typeof Form>;

  @hasOne(() => Form, {
    onQuery: (query) =>
      query.where("is_first_form", true).preload("attributes"),
  })
  declare firstForm: HasOne<typeof Form>;

  @hasMany(() => Attribute)
  declare attributes: HasMany<typeof Attribute>;

  @column()
  declare socialMediaLinks: string[] | null;

  @column()
  declare termsLink: string | null;

  @beforeCreate()
  static deactivateNewEvent(event: Event) {
    event.isActive = false;
  }
}
