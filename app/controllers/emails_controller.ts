import { HttpContext } from '@adonisjs/core/http'
import Email from '#models/email'
// import Event from '#models/event'
import { emailsStoreValidator, emailsUpdateValidator } from '#validators/emails'

export default class EmailsController {
  /**
   * List emails for a specific event
   */
  async index({ params, response }: HttpContext) {
    const eventId = Number(params.id)

    const emails = await Email.query()
      .where('event_id', eventId)
      .preload('participants', async (query) => {
        await query.pivotColumns(['status'])
      })

    const emailSummaries = emails.map((email) => ({
      id: email.id,
      name: email.name,
      pending: email.participants.filter((p) => p.$extras.pivot_status === 'pending').length,
      sent: email.participants.filter((p) => p.$extras.pivot_status === 'sent').length,
      failed: email.participants.filter((p) => p.$extras.pivot_status === 'failed').length,
    }))

    return response.status(200).send(emailSummaries)
  }

  /**
   * Create an email for a specific event
   */
  async store({ params, request, response }: HttpContext) {
    const eventId = Number(params.id)

    const data = await emailsStoreValidator.validate(request.all())

    if (data.trigger) {
      const validTriggers = ['participant_registered', 'form_filled', 'attribute_changed']
      if (!validTriggers.includes(data.trigger)) {
        return response.status(400).send({ message: 'Invalid trigger provided.' })
      }

      if (
        (data.trigger === 'form_filled' || data.trigger === 'attribute_changed') &&
        !data.triggerValue
      ) {
        return response
          .status(400)
          .send({ message: 'Trigger value is required for the selected trigger.' })
      }
    }

    const email = await Email.create({ ...data, eventId })

    return response.status(201).send(email)
  }

  /**
   * Show a specific email for an event
   */
  async show({ params, response }: HttpContext) {
    const eventId = Number(params.id)
    const emailId = Number(params.email_id)

    const email = await Email.query()
      .where('id', emailId)
      .where('event_id', eventId)
      .preload('participants', async (query) => {
        await query.pivotColumns(['status'])
      })
      .firstOrFail()

    return response.status(200).send(email)
  }

  /**
   * Update an email for a specific event
   */
  async update({ params, request, response }: HttpContext) {
    const emailId = Number(params.email_id)

    const data = await emailsUpdateValidator.validate(request.all())

    if (data.trigger) {
      const validTriggers = ['participant_registered', 'form_filled', 'attribute_changed']
      if (!validTriggers.includes(data.trigger)) {
        return response.status(400).send({ message: 'Invalid trigger provided.' })
      }

      if (
        (data.trigger === 'form_filled' || data.trigger === 'attribute_changed') &&
        !data.triggerValue
      ) {
        return response
          .status(400)
          .send({ message: 'Trigger value is required for the selected trigger.' })
      }
    }

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
