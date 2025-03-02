import Event from "#models/event";
import Participant from "#models/participant";

import {
  CreateParticipantDTO,
  UpdateParticipantDTO,
} from "../types/participant_types.js";

export class ParticipantService {
  async createParticipant(
    eventId: number,
    createParticipantDTO: CreateParticipantDTO,
  ): Promise<Participant> {
    const { participantAttributes, ...participantData } = createParticipantDTO;

    const event = await Event.findOrFail(eventId);

    const participant = await event
      .related("participants")
      .create(participantData);

    if (
      participantAttributes !== undefined &&
      participantAttributes.length > 0
    ) {
      const transformedAttributes = Object.fromEntries(
        participantAttributes.map((participantAttribute) => [
          participantAttribute.attributeId,
          { value: participantAttribute.value },
        ]),
      );

      await participant.related("attributes").attach(transformedAttributes);
    }

    await participant.load("attributes");

    return participant;
  }

  async updateParticipant(
    eventId: number,
    participantId: number,
    updateParticipantDTO: UpdateParticipantDTO,
  ) {
    const { participantAttributes, ...updates } = updateParticipantDTO;

    const participant = await Participant.query()
      .where("id", participantId)
      .andWhere("event_id", eventId)
      .firstOrFail();

    participant.merge(updates);
    await participant.save();

    if (
      participantAttributes !== undefined &&
      participantAttributes.length > 0
    ) {
      const transformedAttributes = Object.fromEntries(
        participantAttributes.map((participantAttribute) => [
          participantAttribute.attributeId,
          { value: participantAttribute.value },
        ]),
      );

      await participant
        .related("attributes")
        .sync(transformedAttributes, false);
    }

    const updatedParticipant = await Participant.query()
      .where("id", participantId)
      .where("event_id", eventId)
      .preload("attributes", (attributesQuery) =>
        attributesQuery
          .select("id", "name", "slug")
          .pivotColumns(["value"])
          .where("show_in_list", true),
      )
      .firstOrFail();

    return updatedParticipant;
  }
}
