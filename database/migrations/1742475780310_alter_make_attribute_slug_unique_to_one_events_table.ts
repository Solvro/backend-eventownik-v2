import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "attributes";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(["slug"]);
      table.unique(["slug", "event_id"]);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(["slug", "event_id"]);
      table.unique(["slug"]);
    });
  }
}
