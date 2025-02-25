import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "form_definitions";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table
        .integer("attribute_id")
        .unsigned()
        .references("attributes.id")
        .onDelete("CASCADE");
      table
        .integer("form_id")
        .unsigned()
        .references("forms.id")
        .onDelete("CASCADE");
      table.boolean("is_editable").defaultTo(false).notNullable();
      table.boolean("is_required").defaultTo(true).notNullable();
      table.timestamps();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
