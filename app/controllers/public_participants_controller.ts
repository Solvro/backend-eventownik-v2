import type { HttpContext } from "@adonisjs/core/http";

export default class PublicParticipantsController {
  /**
   * @index
   * @tag public_participants
   * @summary Get participant
   * @operationId getPublicParticipant
   * @description Get participant with :participantSlug and :eventSlug
   * @paramQuery <attributes[]> - Array of attributes id to fetch
   * @responseBody 200 - <Participant.with(attributes)>
   * @responseBody 401 - { errors: [{ message: "Unauthorized access" }] }
   */
  async index({ participant, request }: HttpContext) {
    await participant.load("attributes", (q) =>
      q
        .has("forms")
        .pivotColumns(["value", "created_at"])
        .whereIn("attributes.id", request.input("attributes", []) as number[]),
    );
    return participant;
  }
}
