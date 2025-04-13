import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "blocks";

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("is_root_block").notNullable().defaultTo(false);
    });

    this.schema.raw(
      `CREATE UNIQUE INDEX unique_root_block_per_attribute ON ${this.tableName} (attribute_id) WHERE is_root_block = true;`,
    );
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("is_root_block");

      this.schema.raw("DROP INDEX IF EXISTS unique_root_block_per_attribute");
    });
  }
}
