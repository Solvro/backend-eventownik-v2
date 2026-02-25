import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "attributes";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("allow_other").defaultTo(false).notNullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("allow_other");
    });
  }
}
