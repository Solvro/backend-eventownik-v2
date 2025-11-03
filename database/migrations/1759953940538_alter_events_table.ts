import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "events";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("is_active").defaultTo(false);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("is_active");
    });
  }
}
