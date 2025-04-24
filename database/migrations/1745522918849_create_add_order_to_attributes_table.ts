import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "add_order_to_attributes";

  async up() {
    this.schema.alterTable("attributes", (table) => {
      table.integer("order").unsigned().nullable().defaultTo(0);
    });
  }

  async down() {
    this.schema.alterTable("attributes", (table) => {
      table.dropColumn("order");
    });
  }
}
