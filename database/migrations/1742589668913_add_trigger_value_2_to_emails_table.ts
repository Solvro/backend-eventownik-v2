import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "emails";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string("trigger_value_2").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("trigger_value_2");
    });
  }
}
