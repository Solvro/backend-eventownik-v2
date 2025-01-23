import { BaseSchema } from "@adonisjs/lucid/schema";

export default class EmailsSchema extends BaseSchema {
  protected tableName = "emails";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table
        .integer("event_id")
        .unsigned()
        .references("id")
        .inTable("events")
        .onDelete("CASCADE");
      table.text("name").notNullable();
      table.text("content").notNullable();
      table.text("trigger").notNullable();
      table.text("trigger_value").nullable();
      table.timestamps();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
