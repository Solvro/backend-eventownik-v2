import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "password_resets";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table.string("email").notNullable();
      table.string("token").notNullable();
      table.boolean("used").defaultTo(false);
      table.timestamp("expiry_date").notNullable();

      table.timestamp("created_at");
      table.timestamp("updated_at");
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
