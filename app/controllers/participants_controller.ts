import Participant from "#models/participant";
import {
  participantsStoreValidator,
  participantsUpdateValidator,
} from "#validators/participants";
import { HttpContext } from "@adonisjs/core/http";

export default class ParticipantsController {
  /**
   * @index
   * @tag participants
   */
  async index(): Promise<Participant[]> {
    const participants = await Participant.all();
    return participants;
  }

  /**
   * @store
   * @tag participants
   */
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
}
