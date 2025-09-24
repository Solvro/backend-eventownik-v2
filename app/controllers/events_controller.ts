import { existsSync, unlinkSync } from "node:fs";

import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";
import db from "@adonisjs/lucid/services/db";

import Event from "#models/event";
import Permission from "#models/permission";
import { PhotoService } from "#services/photo_service";
import env from "#start/env";
import {
  createEventValidator,
  displayEvents,
  updateEventValidator,
} from "#validators/event";

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
   * @responseBody 201 - <Event>.with(permissions, forms)
   * @responseBody 401 - Unauthorized access
   * @tag event
   */
  public async show({ params, auth, bouncer }: HttpContext) {
    const event = await Event.query()
      .where("id", Number(params.id))
      .preload("permissions", (q) =>
        q.where("admin_permissions.admin_id", auth.user?.id ?? 0),
      )
      .preload("firstForm")
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
    await event.load("firstForm");
    return event;
  }

  /**
   * @publicIndex
   * @operationId indexPublicEvent
   * @description Shows all event basic data without login
   * @paramQuery from - filtering from event start date - @type(Date)
   * @paramQuery to - filtering from to end date - @type(Date)
   * @responseBody 200 - <Event[]>.exclude(organizerId,lat,long,contactEmail,createdAt,id,updatedAt,termsLink,socialMediaLinks)
   * @tag event
   */
  public async publicIndex({ request }: HttpContext) {
    const params = await request.validateUsing(displayEvents);
    const events = await Event.query()
      .if(params.from, (q) =>
        q.where("start_date", ">=", params.from.toFormat("yyyy-MM-dd")),
      )
      .if(params.to, (q) =>
        q.where("end_date", "<=", params.to.toFormat("yyyy-MM-dd")),
      )
      .select(
        "name",
        "description",
        "slug",
        "start_date",
        "end_date",
        "organizer",
        "primary_color",
        "participants_count",
        "photo_url",
        "location",
      );

    return events;
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
        meta: { eventId: event.id },
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
