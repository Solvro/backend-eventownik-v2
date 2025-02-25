import type { HttpContext } from "@adonisjs/core/http";

export default class PublicParticipantsController {
  /**
   * @index
   * @tag public_participants
   * @summary Get participant
   * @operationId getPublicParticipant
   * @description Get participant with :participantSlug and :eventSlug
   * @responseBody 200 - <Participant>
   * @responseBody 401 - { errors: [{ message: "Unauthorized access" }] }
   */
  async index({ participant }: HttpContext) {
    return participant;
  }
}
