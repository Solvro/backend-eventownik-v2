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

import Email from "#models/email";
import Form from "#models/form";

import Admin from "./admin.js";
import Attribute from "./attribute.js";
import Participant from "./participant.js";
import Permission from "./permission.js";

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  declare uuid: string;

  @column()
  declare organizerUuid: string;

  @column()
  declare name: string;

  @column()
  declare description: string | null;

  @column.dateTime({
    serialize: (value: DateTime) => value.toISO({ includeOffset: false }),
  })
  declare startDate: DateTime;

  @column.dateTime({
    serialize: (value: DateTime) => value.toISO({ includeOffset: false }),
  })
  declare endDate: DateTime;

  @column.dateTime({
    serialize: (value: DateTime | null) =>
      value !== null ? value.toISO({ includeOffset: false }) : value,
  })
  declare verifiedAt: DateTime | null;

  @column()
  declare long: number | null;

  @column()
  declare primaryColor: string | null;

  @column()
  declare contactEmail: string | null;

  @column()
  declare organizerName: string | null;

  @column()
  declare participantsCount: number | null;

  @column()
  declare location: string | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @column()
  declare photoUrl: string | null;

  @column()
  declare policyLinks: string[] | null;

  @column()
  declare links: string[] | null;

  @column()
  declare termsLink: string | null;

  @column()
  declare registerFormUuid: string | null;

  @manyToMany(() => Admin, {
    pivotTable: "AdminsPermissions",
    pivotColumns: ["permissionUuid"],
    pivotTimestamps: true,
  })
  declare admins: ManyToMany<typeof Admin>;

  @belongsTo(() => Admin, {
    foreignKey: "organizerUuid",
  })
  declare mainOrganizer: BelongsTo<typeof Admin>;

  @manyToMany(() => Permission, {
    pivotTable: "AdminsPermissions",
    pivotColumns: ["adminUuid"],
    pivotTimestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  })
  declare permissions: ManyToMany<typeof Permission>;

  @hasMany(() => Participant)
  declare participants: HasMany<typeof Participant>;

  @hasMany(() => Email)
  declare emails: HasMany<typeof Email>;

  @hasMany(() => Form)
  declare forms: HasMany<typeof Form>;

  @belongsTo(() => Form, {
    foreignKey: "registerFormUuid",
  })
  declare registerForm: BelongsTo<typeof Form>;

  @hasMany(() => Attribute)
  declare attributes: HasMany<typeof Attribute>;

  @beforeCreate()
  static assignUuid(event: Event) {
    event.uuid = randomUUID();
  }
}
