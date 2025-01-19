import { HttpContext } from '@adonisjs/core/http'
import Email from '#models/email'
import Event from '#models/event'
import { emailsStoreValidator, emailsUpdateValidator } from '#validators/emails'

export default class EmailsController {
  /**
   * List emails for a specific event
   */
  async index({ params, response }: HttpContext) {
    const eventId = Number(params.id);

    const emails = await Email.query()
      .where('event_id', eventId)
      .withCount('participants', async (query) => {
        await query.wherePivot('status', 'pending').as('pending_count');
      })
      .withCount('participants', async (query) => {
        await query.wherePivot('status', 'sent').as('sent_count');
      })
      .withCount('participants', async (query) => {
        await query.wherePivot('status', 'failed').as('failed_count');
      });

    const emailSummaries = emails.map((email) => ({
      id: email.id,
      name: email.name,
      pending: email.$extras.pending_count || 0,
      sent: email.$extras.sent_count || 0,
      failed: email.$extras.failed_count || 0,
    }));

    return response.status(200).send(emailSummaries);
  }

  /**
   * Create an email for a specific event
   */
  async store({ params, request, response }: HttpContext) {
    const eventId = Number(params.id);

    try {
      const event = await Event.findOrFail(eventId);
      const data = await emailsStoreValidator.validate(request.all());
      const email = await event.related('emails').create(data);

      return response.status(201).send(email);
    } catch {
        return response.status(400).send({
        message: 'Failed to create email'
      });
    }
  }

  /**
   * Update an email for a specific event
   */
  async update({ params, request, response }: HttpContext) {
    const emailId = Number(params.email_id)

    const data = await emailsUpdateValidator.validate(request.all())

    const email = await Email.findOrFail(emailId)
    email.merge(data)
    await email.save()

    return response.status(200).send({ message: 'Email successfully updated.', email })
  }

  /**
   * Delete an email for a specific event
   */
  async destroy({ params, response }: HttpContext) {
    const emailId = Number(params.email_id)

    const email = await Email.findOrFail(emailId)
    await email.related('participants').detach()
    await email.delete()

    return response.status(200).send({ message: 'Email successfully deleted.' })
  }
}
