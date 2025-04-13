import { DateTime } from "luxon";

import { BaseModel, belongsTo, column, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

import Attribute from "./attribute.js";

export default class Block extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare name: string;

  @column()
  declare description: string | null;

  @column()
  declare parentId: number | null;

  @column()
  declare capacity: number | null;

  @column()
  declare isRootBlock: boolean;

  @column()
  declare attributeId: number;

  @hasMany(() => Block, {
    foreignKey: "parentId",
  })
  declare children: HasMany<typeof Block>;

  @belongsTo(() => Block, {
    foreignKey: "parentId",
  })
  declare parent: BelongsTo<typeof Block>;

  @belongsTo(() => Attribute)
  declare attribute: BelongsTo<typeof Attribute>;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  serializeExtras = true;
}
