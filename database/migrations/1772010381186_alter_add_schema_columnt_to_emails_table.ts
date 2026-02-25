import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "emails";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text("schema").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("schema");
    });
  }
}
