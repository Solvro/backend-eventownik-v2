import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "attributes";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("is_multiple").defaultTo(false);
      table.integer("max_selections").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("is_multiple");
      table.dropColumn("max_selections");
    });
  }
}
