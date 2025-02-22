import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "attributes";

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.string("name", 255);
      table.text("slug").nullable();
      table.integer("event_id").unsigned().references("events.id").nullable();
      table.boolean("show_in_list").defaultTo(false);
      table.json("options").nullable();
      table
        .enum(
          "type",
          [
            "text",
            "number",
            "file",
            "select",
            "block",
            "date",
            "time",
            "datetime",
            "email",
            "tel",
            "color",
            "checkbox",
          ],
          {
            useNative: true,
            enumName: "attribute_type",
            existingType: false,
          },
        )
        .nullable();
      table.timestamps();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
    this.schema.raw('DROP TYPE IF EXISTS "attribute_type"');
  }
}
