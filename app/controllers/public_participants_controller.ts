import type { HttpContext } from "@adonisjs/core/http";

import Attribute from "#models/attribute";

export default class PublicParticipantsController {
  private formatAttributes(attributes: Attribute[]) {
    const grouped = new Map<number, Attribute>();

    for (const attr of attributes) {
      const pivotValue = attr.$extras.pivot_value as string;

      const existing = grouped.get(attr.id);
      if (existing !== undefined) {
        const existingPivotValue = existing.$extras.pivot_value as
          | string
          | string[];

        if (Array.isArray(existingPivotValue)) {
          existing.$extras.pivot_value = [...existingPivotValue, pivotValue];
        } else {
          existing.$extras.pivot_value = [existingPivotValue, pivotValue];
        }
      } else {
        if (attr.isMultiple === true && attr.type === "block") {
          attr.$extras.pivot_value = [pivotValue];
        }

        grouped.set(attr.id, attr);
      }
    }

    return Array.from(grouped.values());
  }

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

    const serializedParticipant = participant.toJSON() as Record<
      string,
      unknown
    >;
    serializedParticipant.attributes = this.formatAttributes(
      participant.attributes,
    ).map((attribute) => attribute.toJSON());

    return serializedParticipant;
  }
}
