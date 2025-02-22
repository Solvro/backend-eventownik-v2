import { HttpContext } from "@adonisjs/core/http";

import Email from "#models/email";
import Event from "#models/event";
import {
  emailsStoreValidator,
  emailsUpdateValidator,
} from "#validators/emails";

export default class EmailsController {
  /**
   * @index
   * @operationId listEmails
   * @description Retrieve a list of emails for a specific event, along with their sending status.
   * @tag emails
   * @responseBody 200 - [{\"email": {"id": 1, "eventId": 1, "name": "Welcome Email", "content": "Hello name, welcome to the event!", "trigger": "participant_registered", "triggerValue": null, "createdAt": "2025-02-19T10:58:37.602+00:00", "updatedAt": "2025-02-19T10:58:37.602+00:00"}, "pending": 0, "sent": 0, "failed": 0}]
   */
  async index({ params, response, bouncer }: HttpContext) {
    const eventId = Number(params.eventId);
    await bouncer.authorize("manage_email", await Event.findOrFail(eventId));

    const emails = await Email.query()
      .where("event_id", eventId)
      .withCount("participants", (q) =>
        q.where("status", "failed").as("failedCount"),
      )
      .withCount("participants", (q) =>
        q.where("status", "pending").as("pendingCount"),
      )
      .withCount("participants", (q) =>
        q.where("status", "sent").as("sentCount"),
      );

    return response.status(200).send(emails);
  }

  /**
   * @show
   * @operationId getEmail
   * @description Retrieve details of a specific email linked to an event.
   * @tag emails
   * @responseBody 200 - {"id": 1, "name": "Email Name", "content": "Email Content", "trigger": "participant_registered"}
   * @responseBody 404 - {"message": "Email not found"}
   */
  async show({ params, response }: HttpContext) {
    const emailId = Number.parseInt(String(params.id));
    const event = await Event.findOrFail(params.eventId);

    const email = await event
      .related("emails")
      .query()
      .where("id", emailId)
      .firstOrFail();

    return response.status(200).send(email);
  }

  /**
   * @store
   * @operationId createEmail
   * @description Create a new email associated with a specific event.
   * @tag emails
   * @requestBody <emailsStoreValidator>
   * @responseBody 201 - {"id": 1, "name": "Email Name", "content": "Email Content", "trigger": "participant_registered"}
   * @responseBody 400 - {"message": "Failed to create email"}
   */
  async store({ params, request, response }: HttpContext) {
    const event = await Event.findOrFail(+params.eventId);

    const data = await emailsStoreValidator.validate(request.all());

    const email = await event.related("emails").create(data);

    return response.status(201).send(email);
  }

  /**
   * @update
   * @operationId updateEmail
   * @description Update an existing email associated with a specific event and return the updated email.
   * @tag emails
   * @requestBody <emailsUpdateValidator>
   * @responseBody 200 - {"id": 1, "name": "Updated Name", "content": "Updated Content", "trigger": "form_filled"}
   */
  async update({ params, request }: HttpContext) {
    const data = await emailsUpdateValidator.validate(request.all());

    const emailId = Number(params.id);
    const email = await Email.findOrFail(emailId);

    email.merge(data);

    await email.save();

    return email;
  }

  /**
   * @destroy
   * @operationId deleteEmail
   * @description Remove an email associated with a specific event.
   * @tag emails
   * @responseBody 204 - {}
   */
  async destroy({ params, response }: HttpContext) {
    const emailId = Number(params.id);
    const email = await Email.findOrFail(emailId);

    await email.related("participants").detach();
    await email.delete();

    return response.noContent();
  }
}
