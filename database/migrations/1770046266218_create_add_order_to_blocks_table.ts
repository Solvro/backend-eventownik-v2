import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "blocks";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer("order").unsigned().defaultTo(0).notNullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("order");
    });
  }
}
