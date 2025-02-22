import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "blocks";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.string("name", 255);
      table.text("description", "long").nullable();
      table.integer("capacity").nullable();
      table
        .integer("parent_id")
        .unsigned()
        .references("blocks.id")
        .onDelete("CASCADE")
        .nullable();
      table.integer("attribute_id").unsigned().references("attributes.id");
      table.timestamps();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
