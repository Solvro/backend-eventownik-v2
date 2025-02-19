import { DateTime } from "luxon";

import { BaseModel, belongsTo, column, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";

export default class Block extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  // @belongsTo(() => Attribute)
  // declare attribute: HasOne<typeof Attribute>;

  @column()
  declare name: string;

  @column()
  declare description: string | null;

  @column()
  declare parentId: number | null;

  @belongsTo(() => Block, {
    foreignKey: "parentId",
  })
  declare parent: BelongsTo<typeof Block>;

  @hasMany(() => Block, {
    foreignKey: "parentId",
  })
  declare children: HasMany<typeof Block>;

  @column()
  declare capacity: number | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
