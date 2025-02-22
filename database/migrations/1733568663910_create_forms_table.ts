import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "forms";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table.string("name").notNullable();
      table.string("slug").notNullable().unique();
      table.timestamp("start_date").defaultTo("NOW()");
      table.boolean("is_open").defaultTo(false);

      table.text("description", "long").nullable();
      table.timestamp("end_date").nullable();

      table.integer("event_id").unsigned();

      table.timestamps();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
