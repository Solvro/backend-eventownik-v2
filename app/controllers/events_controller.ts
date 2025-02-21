import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import db from "@adonisjs/lucid/services/db";

import Event from "#models/event";
import Permission from "#models/permission";
import { FileService } from "#services/file_service";
import env from "#start/env";

@inject()
export default class EventController {
  // eslint-disable-next-line no-useless-constructor
  constructor(private fileService: FileService) {}

  /**
   * @index
   * @operationId getEvents
   * @description Returns admin events
   * @responseBody 200 - <Event[]>
   * @tag event
   */
  public async index({ auth }: HttpContext) {
    await auth.user?.preload("events");
    return auth.user?.events;
  }

  /**
   * @store
   * @operationId createEvent
   * @description Creates a new event for the authenticated user. Date should be in format 2025-01-05 12:00:00
   * @requestFormDataBody <createEventValidator>
   * @responseBody 201 - <Event>
   * @responseBody 400 - Invalid input data
   * @responseBody 401 - Unauthorized access
   * @responseBody 422 - Validation failed
   * @tag event
   */
  public async store({ request, response, auth }: HttpContext) {
    const { photo, ...eventData } =
      await request.validateUsing(createEventValidator);

    let photoUrl = null;

    if (photo !== undefined) {
      const photoStoragePath = env.get(
        "PHOTO_STORAGE_URL",
        "storage/event-photos",
      );

      photoUrl = await this.fileService.storeFile(photo, photoStoragePath);
    }

    const event = await Event.create({
      ...eventData,
      photoUrl,
      organizerId: auth.user?.id,
    });

    const permission = await Permission.query()
      .where("action", "manage")
      .where("subject", "all")
      .firstOrFail();

    await auth.user
      ?.related("permissions")
      .attach({ [permission.id]: { event_id: event.id } });

    return response.created(event);
  }

  /**
   * @show
   * @operationId showEvent
   * @description Shows one event with logged user permission
   * @responseBody 201 - <Event>.with(permissions)
   * @responseBody 401 - Unauthorized access
   * @tag event
   */
  public async show({ params, auth, bouncer }: HttpContext) {
    const event = await Event.query()
      .where("id", Number(params.id))
      .preload("permissions", (q) =>
        q.where("admin_permissions.admin_id", auth.user?.id ?? 0),
      )
      .first();

    await bouncer.authorize("manage_event", event);
    return event;
  }

  /**
   * @update
   * @operationId updateEvent
   * @description Updates an existing event if user has permission. Date should be in format 2025-01-05 12:00:00
   * @paramPath id - Event identifier - @type(number) @required
   * @requestBody <updateEventValidator>
   * @responseBody 200 - { message: "Event updated successfully", "event":"<Event>" }
   * @responseBody 400 - Invalid input data
   * @responseBody 403 - Not authorized to update this event
   * @responseBody 404 - Event not found
   * @responseBody 422 - Validation failed
   * @tag event
   */
  public async update({ params, request, response, bouncer }: HttpContext) {
    const event = await Event.findOrFail(params.id);
    await bouncer.authorize("manage_settings", event);
    const data = await updateEventValidator.validate(request.all());
    event.merge(data);
    await event.save();
    return response.ok({ message: "Event updated successfully", event });
  }

  /**
   * @destroy
   * @operationId deleteEvent
   * @description Deletes an event if user has permission
   * @paramPath id - Event identifier - @type(number) @required
   * @responseBody 204 - {}
   * @responseBody 401 - You don't have permissions to this actions
   * @responseBody 404 - Event not found
   * @tag event
   */
  public async destroy({ response, params, auth }: HttpContext) {
    const event = await Event.findOrFail(params.id);
    if ((auth.user?.id ?? null) !== event.organizerId) {
      return response.unauthorized({
        message: "You don't have permissions to this actions",
      });
    }
    await db.from("admin_permissions").where("event_id", event.id).delete();
    await event.delete();
    return { message: "Event successfully deleted" };
  }
}
