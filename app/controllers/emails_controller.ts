import { HttpContext } from '@adonisjs/core/http'
import Email from '#models/email'
import { emailsStoreValidator, emailsUpdateValidator } from '#validators/emails'

export default class EmailsController {
  /**
   * Display a list of resource
   */
  async index({ response }: HttpContext) {
    const emails = await Email.query().preload('participants', async (query) => {
      await query.pivotColumns(['send_at', 'send_by', 'status']);
    });
    return response.status(200).send(emails);
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const data = await emailsStoreValidator.validate(request.all());
    const email = await Email.create(data);
    return response.status(201).send(email);
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    const emailId = Number(params.id);
    const email = await Email.query()
      .where('id', emailId)
      .preload('participants')
      .firstOrFail();

    return response.status(200).send(email);
  }

  /**
   * Edit individual record
   */
  async update({ params, request, response }: HttpContext) {
    const data = await emailsUpdateValidator.validate(request.all());
    const email = await Email.findOrFail(params.id);
    email.merge(data);
    await email.save();
    return response.status(200).send({ message: 'Email successfully updated.', email });
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    const email = await Email.findOrFail(params.id);
    await email.related('participants').detach();
    await email.delete();
    return response.status(200).send({ message: 'Email successfully deleted.' });
  }

  /**
   * Attach a participant to an email
   */
  async attachParticipant({ params, request, response }: HttpContext) {
    const email = await Email.findOrFail(params.id);

    const participantId = request.input('participant_id') as number;

    const pivotData = request.only(['send_at', 'send_by', 'status']) as {
      send_at?: string;
      send_by?: string;
      status?: string;
    };

    await email.related('participants').attach({ [participantId]: pivotData });
    return response.status(201).send({ message: 'Participant successfully attached.' });
  }

  /**
   * Detach a participant from an email
   */
  async detachParticipant({ params, request, response }: HttpContext) {
    const email = await Email.findOrFail(params.id);

    const participantId = request.input('participant_id') as number;

    await email.related('participants').detach([participantId]);
    return response.status(200).send({ message: 'Participant successfully detached.' });
  }
}
