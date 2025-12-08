import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "forms";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer("limit").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("limit");
    });
  }
}
