import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "form_definitions";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer("order").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("order");
    });
  }
}
