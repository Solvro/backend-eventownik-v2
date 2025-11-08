import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import db from "@adonisjs/lucid/services/db";

import Admin from "#models/admin";
import Event from "#models/event";
import { OrganizerService } from "#services/organizer_service";
import {
  addOrganizerValidator,
  updateOrganizerPermissionsValidator,
} from "#validators/organizer";

@inject()
export default class OrganizersController {
  //eslint-disable-next-line no-useless-constructor
  constructor(private organizerService: OrganizerService) {}

  /**
   * @index
   * @operationId getEventOrganizers
   * @description Returns an array of organizers of specified event
   * @tag organizers
   * @responseBody 200 - <Admin[]>
   */
  async index(context: HttpContext) {
    const eventUuid = context.params.eventUuid as string;
    await context.bouncer.authorize(
      "manage_event",
      await Event.findOrFail(eventUuid),
    );

    return await Admin.query()
      .select("uuid", "firstName", "lastName", "email")
      .preload("permissions", (permissionsQuery) =>
        permissionsQuery.where("eventUuid", eventUuid),
      )
      .whereHas("events", (query) => query.where("events.uuid", eventUuid));
  }

  /**
   * @store
   * @operationId addEventOrganizer
   * @description Adds an admin as an event organizer
   * @tag organizers
   * @requestBody <addOrganizerValidator>
   */
  async store({ params, request, bouncer }: HttpContext) {
    const eventUuid = params.eventUuid as string;
    await bouncer.authorize(
      "manage_setting",
      await Event.findOrFail(eventUuid),
    );

    const organizerData = await addOrganizerValidator.validate(request.all());

    await this.organizerService.addOrganizer(eventUuid, organizerData);
  }

  /**
   * @show
   * @operationId getEventOrganizer
   * @description Returns organizer details
   * @tag organizers
   * @responseBody 200 - <Admin>
   * @responseBody 404 - { error: `Organizer with id {organizerUuid} does not exist` },
   */
  async show({ params, bouncer }: HttpContext) {
    const eventUuid = params.eventUuid as string;
    const organizerUuid = params.id as string;
    await bouncer.authorize("manage_event", await Event.findOrFail(eventUuid));

    const organizer = await Admin.query()
      .where("uuid", organizerUuid)
      .whereHas("events", (query) => query.where("events.uuid", eventUuid))
      .preload("permissions", (permissionsQuery) =>
        permissionsQuery.where("eventUuid", eventUuid),
      )
      .firstOrFail();

    return organizer;
  }

  /**
   * @update
   * @operationId updateOrganizerPermissions
   * @description Changes organizer's permissions to the ones specified in the request body
   * @tag organizers
   * @requestBody <updateOrganizerPermissionsValidator>
   * @responseBody 200 - <Admin>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  async update({ params, request, bouncer }: HttpContext) {
    const eventUuid = params.eventUuid as string;
    const organizerUuid = params.id as string;
    await bouncer.authorize(
      "manage_setting",
      await Event.findOrFail(eventUuid),
    );

    const { permissionsIds } =
      await updateOrganizerPermissionsValidator.validate(request.body());

    const updatedOrganizer = this.organizerService.updateOrganizerPermissions(
      organizerUuid,
      eventUuid,
      permissionsIds,
    );

    return updatedOrganizer;
  }

  /**
   * @destroy
   * @operationId removeOrganizer
   * @description Removes organizer
   * @tag organizers
   * @responseBody 204 - {}
   */
  async destroy({ params, bouncer, response }: HttpContext) {
    const eventUuid = params.eventUuid as string;
    await bouncer.authorize(
      "manage_setting",
      await Event.findOrFail(eventUuid),
    );
    const organizerUuid = params.id as string;

    await db
      .from("adminPermissions")
      .where("adminUuid", organizerUuid)
      .where("eventUuid", eventUuid)
      .delete();

    return response.noContent();
  }
}
