import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "participants";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.string("email", 255).notNullable();
      table
        .integer("event_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("events")
        .onDelete("CASCADE");
      table.string("slug", 255).notNullable();
      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
