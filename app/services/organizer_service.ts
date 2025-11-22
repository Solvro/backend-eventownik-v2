import { inject } from "@adonisjs/core";

import Admin from "#models/admin";
import { createAdminValidator } from "#validators/admin";

import { AdminService } from "./admin_service.js";

@inject()
export class OrganizerService {
  // eslint-disable-next-line no-useless-constructor
  constructor(private adminService: AdminService) {}

  async addOrganizer(
    eventUuid: string,
    organizerData: { email: string; permissionsUuids: string[] },
  ) {
    const admin = await Admin.findBy("email", organizerData.email);

    if (admin !== null) {
      for (const permissionUuid of organizerData.permissionsUuids) {
        await admin
          .related("permissions")
          .attach({ [permissionUuid]: { eventUuid } });
      }
    } else {
      const newAdminData = await createAdminValidator.validate(organizerData);

      await this.adminService.createAdmin(newAdminData);
    }
  }

  async getOrganizerWithPermissions(organizerId: string, eventUuid: string) {
    return await Admin.query()
      .where("uuid", organizerId)
      .whereHas("events", (eventsQuery) =>
        eventsQuery.where("eventUuid", eventUuid),
      )
      .preload("permissions", (permissionsQuery) =>
        permissionsQuery.where("eventUuid", eventUuid),
      )
      .firstOrFail();
  }

  async updateOrganizerPermissions(
    organizerUuid: string,
    eventUuid: string,
    newPermissionsUuids: string[],
  ) {
    const organizer = await this.getOrganizerWithPermissions(
      organizerUuid,
      eventUuid,
    );

    await organizer
      .related("permissions")
      .detach(organizer.permissions.map((permission) => permission.uuid));

    for (const permissionUuid of newPermissionsUuids) {
      await organizer
        .related("permissions")
        .attach({ [permissionUuid]: { eventUuid } });
    }

    const updatedOrganizer = await Admin.query()
      .where("uuid", organizerUuid)
      .preload("permissions")
      .firstOrFail();

    return updatedOrganizer;
  }
}
