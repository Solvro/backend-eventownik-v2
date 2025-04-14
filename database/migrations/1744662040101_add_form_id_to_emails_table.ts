import { BaseSchema } from "@adonisjs/lucid/schema";

export default class AddFormIdToEmails extends BaseSchema {
  protected tableName = "emails";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer("form_id")
        .unsigned()
        .references("id")
        .inTable("forms")
        .onDelete("SET NULL")
        .nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("form_id");
    });
  }
}
