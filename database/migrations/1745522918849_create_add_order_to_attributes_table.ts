import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "attributes";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer("order").unsigned().notNullable().defaultTo(0);
    });
  }

  async down() {
    this.schema.alterTable("attributes", (table) => {
      table.dropColumn("order");
    });
  }
}
