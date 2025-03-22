import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "events";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string("contact_email").nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("contact_email");
    });
  }
}
