import { BaseSeeder } from "@adonisjs/lucid/seeders";

import Permission from "#models/permission";

export default class extends BaseSeeder {
  async run() {
    await Permission.updateOrCreateMany(
      ["action", "subject"],
      [
        { action: "manage", subject: "all" },
        { action: "manage", subject: "event" },
        { action: "manage", subject: "setting" },
        { action: "manage", subject: "form" },
        { action: "manage", subject: "participant" },
        { action: "manage", subject: "email" },
        { action: "manage", subject: "organizer" },
      ],
    );
  }
}
