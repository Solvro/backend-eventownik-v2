import { HttpContext } from "@adonisjs/core/http";

import Participant from "#models/participant";
import {
  participantsStoreValidator,
  participantsUpdateValidator,
} from "#validators/participants";

export default class ParticipantsController {
  /**
   * @index
   * @tag participants
   */
  async index(): Promise<Participant[]> {
    const participants = await Participant.all();
    return participants;
  }

  async store({ request, response }: HttpContext) {
    const data = await participantsStoreValidator.validate(request.all());
    const participant = await Participant.create(data);
    return response.status(201).send(participant);
  }

  /**
   * @show
   * @tag participants
   */
  async show({ params }: HttpContext) {
    return await Participant.findOrFail(params.id);
  }

  /**
   * @update
   * @tag participants
   */
  async update({ params, request }: HttpContext) {
    const data = await participantsUpdateValidator.validate(request.all());
    const participant = await Participant.findOrFail(params.id);
    participant.merge(data);
    await participant.save();
    return { message: `Participant successfully updated.`, participant };
  }

  /**
   * @destroy
   * @tag participants
   */
  async destroy({ params }: HttpContext) {
    const participant = await Participant.findOrFail(params.id);
    await participant.delete();
    return { message: `Participant successfully deleted.` };
  }

  async attachEmail({ params, request, response }: HttpContext) {
    const participant = await Participant.findOrFail(params.id);

    const emailId = request.input('email_id') as number;
    const pivotData = request.only(['send_at', 'send_by', 'status']) as {
      send_at?: string;
      send_by?: string;
      status?: string;
    };

    // const email = await Email.findOrFail(emailId);

    await participant.related('emails').attach({ [emailId]: pivotData });

    return response.status(201).send({ message: 'Email successfully sent' });
  }
}
