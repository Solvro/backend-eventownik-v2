import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";

import {
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
  hasMany,
} from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import Attribute from "./attribute.js";

export default class Block extends BaseModel {
  @column({ isPrimary: true })
  declare uuid: string;

  @column()
  declare name: string;

  @column()
  declare description?: string | null;

  @column()
  declare parentUuid: string | null;

  @column()
  declare capacity?: number | null;

  @column()
  declare order?: number | null;

  @column()
  declare attributeUuid?: string | null;

  @hasMany(() => Block, {
    foreignKey: "parentUuid",
  })
  declare children: HasMany<typeof Block>;

  @belongsTo(() => Block, {
    foreignKey: "parentUuid",
  })
  declare parent: BelongsTo<typeof Block>;

  @belongsTo(() => Attribute)
  declare attribute: BelongsTo<typeof Attribute>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @beforeCreate()
  static assignUuid(block: Block) {
    block.uuid = randomUUID();
  }

  serializeExtras = true;
}
