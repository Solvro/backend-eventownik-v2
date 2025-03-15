import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "attributes";

  async up() {
    this.schema.raw(
      `ALTER TABLE attributes ALTER COLUMN show_in_list SET DEFAULT TRUE;`,
    );
  }

  async down() {
    this.schema.raw(
      `ALTER TABLE attributes ALTER COLUMN show_in_list SET DEFAULT FALSE;`,
    );
  }
}
