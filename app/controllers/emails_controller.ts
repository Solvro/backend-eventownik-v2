import { HttpContext } from '@adonisjs/core/http'
import Email from '#models/email'
import Event from '#models/event'
import { emailsStoreValidator, emailsUpdateValidator } from '#validators/emails'

export default class EmailsController {
  /**
   * @index
   * @operationId listEmails
   * @description List emails for a specific event.
   * @tag emails
   * @responseBody 200 - [{"id": 1, "name": "Email Name", "pending": 5, "sent": 10, "failed": 2}]
   */
  async index({ params, response }: HttpContext) {
    const eventId = Number.parseInt(String(params.event_id), 10);

    const emails = await Email.query().where('event_id', eventId);

    const emailSummaries = await Promise.all(
      emails.map(async (email) => {
        const pendingCount = await email
          .related('participants')
          .query()
          .wherePivot('status', 'pending')
          .count('* as total');

        const sentCount = await email
          .related('participants')
          .query()
          .wherePivot('status', 'sent')
          .count('* as total');

        const failedCount = await email
          .related('participants')
          .query()
          .wherePivot('status', 'failed')
          .count('* as total');

        return {
          id: email.id,
          name: email.name,
          pending: Number(pendingCount[0]?.$extras?.total || 0),
          sent: Number(sentCount[0]?.$extras?.total || 0),
          failed: Number(failedCount[0]?.$extras?.total || 0),
        };
      })
    );

    return response.status(200).send(emailSummaries);
  }

  /**
   * @show
   * @operationId getEmail
   * @description Show a specific email for a specific event.
   * @tag emails
   * @responseBody 200 - {"id": 1, "name": "Email Name", "content": "Email Content", "trigger": "participant_registered"}
   * @responseBody 404 - {"message": "Email not found"}
   */
  async show({ params, response }: HttpContext) {
    const emailId = Number.parseInt(String(params.id));
    try {
      const event = await Event.findOrFail(params.event_id);
      const email = await event.related('emails').query().where('id', emailId).firstOrFail();
      return response.status(200).send(email);
    } catch (error) {
      return response.status(404).send({ message: 'Email not found' });
    }
  }

  /**
   * @store
   * @operationId createEmail
   * @description Create an email for a specific event.
   * @tag emails
   * @requestBody <emailsStoreValidator>
   * @responseBody 201 - {"id": 1, "name": "Email Name", "content": "Email Content", "trigger": "participant_registered"}
   * @responseBody 400 - {"message": "Failed to create email"}
   */
  async store({ params, request, response }: HttpContext) {
    const eventId = Number(params.event_id);
    try {
      const event = await Event.findOrFail(eventId);
      const data = await emailsStoreValidator.validate(request.all());
      const email = await event.related('emails').create(data);
      return response.status(201).send(email);
    } catch (error) {
      return response.status(400).send({ message: 'Failed to create email' });
    }
  }

  /**
   * @update
   * @operationId updateEmail
   * @description Update an email for a specific event.
   * @tag emails
   * @requestBody <emailsUpdateValidator>
   * @responseBody 200 - {"message": "Email successfully updated.", "email": {"id": 1, "name": "Updated Name"}}
   */
  async update({ params, request, response }: HttpContext) {
    const emailId = Number(params.id);
    const data = await emailsUpdateValidator.validate(request.all());
    const email = await Email.findOrFail(emailId);
    email.merge(data);
    await email.save();
    return response.status(200).send({ message: 'Email successfully updated.', email });
  }

  /**
   * @destroy
   * @operationId deleteEmail
   * @description Delete an email for a specific event.
   * @tag emails
   * @responseBody 200 - {"message": "Email successfully deleted."}
   */
  async destroy({ params, response }: HttpContext) {
    const emailId = Number(params.id);
    const email = await Email.findOrFail(emailId);
    await email.related('participants').detach();
    await email.delete();
    return response.status(200).send({ message: 'Email successfully deleted.' });
  }
}
