import { randomUUID } from "node:crypto";

import {
  BaseModel,
  beforeCreate,
  column,
  manyToMany,
} from "@adonisjs/lucid/orm";
import type { ManyToMany } from "@adonisjs/lucid/types/relations";

import Admin from "./admin.js";

export default class Permission extends BaseModel {
  @column({ isPrimary: true })
  declare uuid: string;

  @column()
  declare action: string;

  @column()
  declare subject: string;

  static async one(action: string, subject: string): Promise<string | null> {
    const permission = await Permission.query()
      .where("action", action)
      .where("subject", subject)
      .first();
    return permission?.uuid ?? null;
  }

  @manyToMany(() => Admin, {
    pivotTable: "AdminPermissions",
    pivotColumns: ["eventUuid"],
    pivotTimestamps: true,
  })
  declare admins: ManyToMany<typeof Admin>;

  @beforeCreate()
  static assignUuid(permission: Permission) {
    permission.uuid = randomUUID();
  }
}
