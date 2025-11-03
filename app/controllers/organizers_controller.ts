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
    const eventId = +context.params.eventId;
    await context.bouncer.authorize(
      "manage_event",
      await Event.findOrFail(eventId),
    );

    return await Admin.query()
      .select("id", "firstName", "lastName", "email")
      .preload("permissions", (permissionsQuery) =>
        permissionsQuery.where("event_id", eventId),
      )
      .whereHas("events", (query) => query.where("events.id", eventId));
  }

  /**
   * @store
   * @operationId addEventOrganizer
   * @description Adds an admin as an event organizer
   * @tag organizers
   * @requestBody <addOrganizerValidator>
   */
  async store({ params, request, bouncer }: HttpContext) {
    const eventId = +params.eventId;
    await bouncer.authorize("manage_setting", await Event.findOrFail(eventId));

    const organizerData = await addOrganizerValidator.validate(request.all());

    await this.organizerService.addOrganizer(eventId, organizerData);
  }

  /**
   * @show
   * @operationId getEventOrganizer
   * @description Returns organizer details
   * @tag organizers
   * @responseBody 200 - <Admin>
   * @responseBody 404 - { error: `Organizer with id {organizerId} does not exist` },
   */
  async show({ params, bouncer }: HttpContext) {
    const eventId = +params.eventId;
    const organizerId = +params.id;
    await bouncer.authorize("manage_event", await Event.findOrFail(eventId));

    const organizer = await Admin.query()
      .where("id", organizerId)
      .whereHas("events", (query) => query.where("events.id", eventId))
      .preload("permissions", (permissionsQuery) =>
        permissionsQuery.where("event_id", eventId),
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
    const eventId = +params.eventId;
    const organizerId = +params.id;
    await bouncer.authorize("manage_setting", await Event.findOrFail(eventId));

    const { permissionsIds } =
      await updateOrganizerPermissionsValidator.validate(request.body());

    const updatedOrganizer = this.organizerService.updateOrganizerPermissions(
      organizerId,
      eventId,
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
    const eventId = +params.eventId;
    await bouncer.authorize("manage_setting", await Event.findOrFail(eventId));
    const organizerId = +params.id;

    await db
      .from("admin_permissions")
      .where("admin_id", organizerId)
      .where("event_id", eventId)
      .delete();

    return response.noContent();
  }
}
