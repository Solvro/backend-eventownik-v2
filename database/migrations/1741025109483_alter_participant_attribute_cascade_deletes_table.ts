import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "participant_attributes";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign("participant_id");
      table
        .foreign("participant_id")
        .references("participants.id")
        .onDelete("CASCADE");

      table.dropForeign("attribute_id");
      table
        .foreign("attribute_id")
        .references("attributes.id")
        .onDelete("CASCADE");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign("participant_id");
      table
        .foreign("participant_id")
        .references("participants.id")
        .onDelete("NO ACTION");

      table.dropForeign("attribute_id");
      table
        .foreign("attribute_id")
        .references("attributes.id")
        .onDelete("NO ACTION");
    });
  }
}
