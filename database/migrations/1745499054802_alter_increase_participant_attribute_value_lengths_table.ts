import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "participant_attributes";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text("value").nullable().alter();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string("value").nullable().alter();
    });
  }
}
