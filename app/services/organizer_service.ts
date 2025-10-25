import { inject } from "@adonisjs/core";

import Admin from "#models/admin";
import { createAdminValidator } from "#validators/admin_validators";

import { AdminService } from "./admin_service.js";

@inject()
export class OrganizerService {
  // eslint-disable-next-line no-useless-constructor
  constructor(private adminService: AdminService) {}

  async addOrganizer(
    eventId: string,
    organizerData: { email: string; permissionsIds: string[] },
  ) {
    const admin = await Admin.findBy("email", organizerData.email);

    if (admin !== null) {
      organizerData.permissionsIds.forEach(async (permissionId) => {
        await admin
          .related("permissions")
          .attach({ [permissionId]: { eventUuid: eventId } });
      });
    } else {
      const newAdminData = await createAdminValidator.validate(organizerData);

      await this.adminService.createAdmin(newAdminData);
    }
  }

  async getOrganizerWithPermissions(organizerId: string, eventId: string) {
    return await Admin.query()
      .where("uuid", organizerId)
      .whereHas("events", (eventsQuery) =>
        eventsQuery.where("eventUuid", eventId),
      )
      .preload("permissions", (permissionsQuery) =>
        permissionsQuery.where("eventUuid", eventId),
      )
      .firstOrFail();
  }

  async updateOrganizerPermissions(
    organizerId: string,
    eventId: string,
    newPermissionsIds: string[],
  ) {
    const organizer = await this.getOrganizerWithPermissions(
      organizerId,
      eventId,
    );

    await organizer
      .related("permissions")
      .detach(organizer.permissions.map((permission) => permission.uuid));

    newPermissionsIds.forEach(async (permissionId) => {
      await organizer
        .related("permissions")
        .attach({ [permissionId]: { event_id: eventId } });
    });

    const updatedOrganizer = await Admin.query()
      .where("uuid", organizerId)
      .preload("permissions")
      .firstOrFail();

    return updatedOrganizer;
  }
}
