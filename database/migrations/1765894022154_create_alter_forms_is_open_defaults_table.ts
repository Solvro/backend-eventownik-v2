import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "forms";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("is_open").defaultTo(true).alter();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("is_open").defaultTo(false).alter();
    });
  }
}
