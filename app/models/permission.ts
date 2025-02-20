import { BaseModel, column, manyToMany } from "@adonisjs/lucid/orm";
import type { ManyToMany } from "@adonisjs/lucid/types/relations";

import Admin from "./admin.js";

export default class Permission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare action: string;

  @column()
  declare subject: string;

  static async one(action: string, subject: string): Promise<number | null> {
    const permission = await Permission.query()
      .where("action", action)
      .where("subject", subject)
      .first();
    return permission?.id ?? null;
  }

  @manyToMany(() => Admin, {
    pivotTable: "admin_permissions",
    pivotColumns: ["event_id"],
    pivotTimestamps: true,
  })
  declare admins: ManyToMany<typeof Admin>;
}
