import { BaseSchema } from "@adonisjs/lucid/schema";

export default class EventsSchema extends BaseSchema {
  protected tableName = "events";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table
        .integer("organizer_id")
        .unsigned()
        .references("admins.id")
        .onDelete("CASCADE");
      table.string("name", 255).notNullable();
      table.text("description", "long").nullable();
      table.string("slug", 255).notNullable();
      table.timestamp("start_date").notNullable();
      table.timestamp("end_date").notNullable();
      table.float("lat").nullable();
      table.float("long").nullable();
      table.string("primary_color", 12);
      table.string("organizer", 255);
      table.integer("participants_count");
      table.string("photo_url").nullable();
      table.specificType("social_media_links", "text[]").nullable();
      table.timestamps();
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
