import { BaseSchema } from "@adonisjs/lucid/schema";

export default class AddSlugToForms extends BaseSchema {
  protected tableName = "forms";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string("slug").notNullable().unique().after("name");
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("slug");
    });
  }
}
