import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = "attributes_add_drawing_types";

  async up() {
    this.schema.raw(`
      ALTER TYPE attribute_type ADD VALUE 'drawing';
    `);
  }

  public async down() {
    this.schema.raw(`
      CREATE TYPE attribute_type_old AS ENUM ('text', 'number', 'file', 'select', 'block', 'date', 'time', 'datetime', 'email', 'tel', 'color', 'checkbox', 'textarea', 'multiselect');

      UPDATE attributes SET type = 'file' WHERE type = 'drawing';

      ALTER TABLE attributes ALTER COLUMN type TYPE attribute_type_old USING type::text::attribute_type_old;

      DROP TYPE attribute_type;

      ALTER TYPE attribute_type_old RENAME TO attribute_type;
    `);
  }
}
