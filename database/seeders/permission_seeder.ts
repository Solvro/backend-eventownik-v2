import Permission from "#models/permission";
import { BaseSeeder } from "@adonisjs/lucid/seeders";

export default class extends BaseSeeder {
  async run() {
    await Permission.updateOrCreateMany(
      ["action", "subject"],
      [
        { action: "manage", subject: "all" },
        { action: "update", subject: "event" },
        { action: "delete", subject: "event" },
        { action: "read", subject: "form" },
        { action: "update", subject: "form" },
        { action: "delete", subject: "form" },
      ],
    );
  }
}
