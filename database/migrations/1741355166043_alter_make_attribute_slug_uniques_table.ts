import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "attributes";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(["slug"]);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(["slug"]);
    });
  }
}
