import Event from "#models/event";
import Participant from "#models/participant";

import { CreateParticipantDTO } from "../types/participant_types.js";

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
      // Transform permissions to match database schema: event_id instead of eventId
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
}
