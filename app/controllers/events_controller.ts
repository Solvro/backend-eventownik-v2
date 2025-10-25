import { existsSync, unlinkSync } from "node:fs";

import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";
import db from "@adonisjs/lucid/services/db";

import Event from "#models/event";
import Permission from "#models/permission";
import { PhotoService } from "#services/photo_service";
import env from "#start/env";
import { createEventValidator, updateEventValidator } from "#validators/event";

@inject()
export default class EventController {
  // eslint-disable-next-line no-useless-constructor
  constructor(private photoService: PhotoService) {}

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
   * @responseBody 500 - { message: "Error while processing the file" }
   * @tag event
   */
  public async store({ request, response, auth }: HttpContext) {
    const { photo, ...eventData } =
      await request.validateUsing(createEventValidator);

    let photoUrl: string | null | undefined = null;

    if (photo !== undefined) {
      photoUrl = await this.photoService.storePhoto(photo);

      if (photoUrl === undefined) {
        return response.internalServerError(
          '{ message: "Error while processing the file" }',
        );
      }
    }
    const event = await Event.create({
      ...eventData,
      photoUrl,
      organizerUuid: auth.user?.uuid,
    });

    const permission = await Permission.query()
      .where("action", "manage")
      .where("subject", "all")
      .firstOrFail();

    await auth.user
      ?.related("permissions")
      .attach({ [permission.uuid]: { eventId: event.uuid } });

    return response.created(event);
  }

  /**
   * @show
   * @operationId showEvent
   * @description Shows one event with logged user permission
   * @responseBody 201 - <Event>.with(permissions, forms)
   * @responseBody 401 - Unauthorized access
   * @tag event
   */
  public async show({ params, auth, bouncer }: HttpContext) {
    const event = await Event.query()
      .where("uuid", params.id as string)
      .preload("permissions", (q) =>
        q.where(
          "AdminsPermissions.adminUuid",
          auth.user?.uuid ?? "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        ),
      )
      .preload("registerForm")
      .first();

    await bouncer.authorize("manage_event", event);
    return event;
  }

  /**
   * @publicShow
   * @operationId showPublicEvent
   * @description Shows one event basic data without login
   * @responseBody 201 - <Event>.with(forms)
   * @tag event
   */
  public async publicShow({ params }: HttpContext) {
    const event = await Event.findByOrFail("slug", params.eventSlug);
    await event.load("registerForm");
    return event;
  }

  /**
   * @update
   * @operationId updateEvent
   * @description Updates an existing event if user has permission. Date should be in format 2025-01-05 12:00:00
   * @paramPath id - Event identifier - @type(number) @required
   * @requestFormDataBody <updateEventValidator>
   * @responseBody 200 - { message: "Event updated successfully", "event":"<Event>" }
   * @responseBody 400 - Invalid input data
   * @responseBody 403 - Not authorized to update this event
   * @responseBody 404 - Event not found
   * @responseBody 422 - Validation failed
   * @tag event
   */
  public async update({ params, request, bouncer }: HttpContext) {
    const event = await Event.findOrFail(params.id);

    await bouncer.authorize("manage_setting", event);

    const { photo, ...eventData } = await request.validateUsing(
      updateEventValidator,
      {
        meta: { eventId: event.uuid },
      },
    );

    let photoUrl: string | null | undefined;
    const photoStoragePath = env.get("PHOTO_STORAGE_URL", "public");

    if (photo !== undefined && photo !== null) {
      photoUrl = await this.photoService.storePhoto(photo);

      if (event.photoUrl !== null) {
        if (existsSync(app.makePath(`${photoStoragePath}/${event.photoUrl}`))) {
          unlinkSync(app.makePath(`${photoStoragePath}/${event.photoUrl}`));
        }
      }
    }

    if (photo === null && event.photoUrl !== null) {
      if (existsSync(app.makePath(`${photoStoragePath}/${event.photoUrl}`))) {
        unlinkSync(app.makePath(`${photoStoragePath}/${event.photoUrl}`));
      }
      photoUrl = null;
    }

    event.merge({ ...eventData, photoUrl });

    await event.save();

    return event;
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
    if ((auth.user?.uuid ?? null) !== event.organizerUuid) {
      return response.unauthorized({
        message: "You don't have permissions to this actions",
      });
    }
    await db.from("AdminsPermissions").where("eventUuid", event.uuid).delete();
    await event.delete();
    return response.noContent();
  }
}
