import { inject } from "@adonisjs/core";

import Admin from "#models/admin";
import { createAdminValidator } from "#validators/admin_validators";

import { AdminService } from "./admin_service.js";

@inject()
export class OrganizerService {
  // eslint-disable-next-line no-useless-constructor
  constructor(private adminService: AdminService) {}

  async addOrganizer(
    eventId: number,
    organizerData: { email: string; permissionsIds: number[] },
  ) {
    const admin = await Admin.findBy("email", organizerData.email);

    if (admin !== null) {
      organizerData.permissionsIds.forEach(async (permissionId) => {
        await admin
          .related("permissions")
          .attach({ [permissionId]: { event_id: eventId } });
      });
    } else {
      const newAdminData = await createAdminValidator.validate(organizerData);

      await this.adminService.createAdmin(newAdminData);
    }
  }

  async getOrganizerWithPermissions(organizerId: number, eventId: number) {
    return await Admin.query()
      .where("id", organizerId)
      .whereHas("events", (eventsQuery) =>
        eventsQuery.where("event_id", eventId),
      )
      .preload("permissions", (permissionsQuery) =>
        permissionsQuery.where("event_id", eventId),
      )
      .firstOrFail();
  }

  async updateOrganizerPermissions(
    organizerId: number,
    eventId: number,
    newPermissionsIds: number[],
  ) {
    const organizer = await this.getOrganizerWithPermissions(
      organizerId,
      eventId,
    );

    await organizer
      .related("permissions")
      .detach(organizer.permissions.map((permission) => permission.id));

    newPermissionsIds.forEach(async (permissionId) => {
      await organizer
        .related("permissions")
        .attach({ [permissionId]: { event_id: eventId } });
    });

    const updatedOrganizer = await Admin.query()
      .where("id", organizerId)
      .preload("permissions")
      .firstOrFail();

    return updatedOrganizer;
  }

  async removeOrganizer(organizerId: number, eventId: number) {
    const organizer = await this.getOrganizerWithPermissions(
      organizerId,
      eventId,
    );

    await organizer
      .related("permissions")
      .detach(organizer.permissions.map((permission) => permission.id));
  }
}
