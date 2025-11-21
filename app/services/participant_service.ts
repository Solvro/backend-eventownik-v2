import Event from "#models/event";
import Participant from "#models/participant";

import {
  CreateParticipantDTO,
  UpdateParticipantDTO,
} from "../types/participant_types.js";
import { EmailService } from "./email_service.js";

export class ParticipantService {
  async createParticipant(
    eventUuid: string,
    createParticipantDTO: CreateParticipantDTO,
  ): Promise<Participant> {
    const { participantAttributes, ...participantData } = createParticipantDTO;

    const event = await Event.findOrFail(eventUuid);

    const participant = await event
      .related("participants")
      .create(participantData);

    if (
      participantAttributes !== undefined &&
      participantAttributes.length > 0
    ) {
      const transformedAttributes: Record<string, { value: string | null }> =
        {};

      for (const attribute of participantAttributes) {
        await EmailService.sendOnTrigger(
          event,
          participant,
          "ATTRIBUTE_CHANGED",
          attribute.attributeUuid,
          attribute.value,
        );
        transformedAttributes[attribute.attributeUuid] = {
          value: attribute.value,
        };
      }

      await participant.related("attributes").attach(transformedAttributes);
    }

    await participant.load("attributes");

    await EmailService.sendOnTrigger(
      event,
      participant,
      "PARTICIPANT_REGISTERED",
    );

    return participant;
  }

  async updateParticipant(
    eventUuid: string,
    participantUuid: string,
    updateParticipantDTO: UpdateParticipantDTO,
  ) {
    const { participantAttributes, ...updates } = updateParticipantDTO;

    const participant = await Participant.query()
      .where("uuid", participantUuid)
      .andWhere("eventUuid", eventUuid)
      .firstOrFail();

    const event = await Event.findOrFail(eventUuid);

    participant.merge(updates);
    await participant.save();

    if (
      participantAttributes !== undefined &&
      participantAttributes.length > 0
    ) {
      const transformedAttributes: Record<string, { value: string | null }> =
        {};

      for (const attribute of participantAttributes) {
        await EmailService.sendOnTrigger(
          event,
          participant,
          "ATTRIBUTE_CHANGED",
          attribute.attributeUuid,
          attribute.value,
        );
        transformedAttributes[attribute.attributeUuid] = {
          value: attribute.value,
        };
      }

      await participant
        .related("attributes")
        .sync(transformedAttributes, false);
    }

    const updatedParticipant = await Participant.query()
      .where("uuid", participantUuid)
      .where("eventUuid", eventUuid)
      .preload("attributes", (attributesQuery) =>
        attributesQuery
          .select("uuid", "name")
          .pivotColumns(["value"])
          .where("showInList", true),
      )
      .firstOrFail();

    return updatedParticipant;
  }

  async unregister(participantUuid: string, eventUuid: string) {
    const event = await Event.findByOrFail("uuid", eventUuid);

    const participant = await Participant.query()
      .where("uuid", participantUuid)
      .andWhere("eventUuid", event.uuid)
      .firstOrFail();

    await EmailService.sendOnTrigger(event, participant, "PARTICIPANT_DELETED");

    await participant.delete();
  }

  async unregisterMany(participantsToUnregisterIds: number[], eventId: number) {
    const event = await Event.findOrFail(+eventId);

    const participants = await Participant.query()
      .whereIn("uuid", participantsToUnregisterIds)
      .andWhere("eventUuid", event.uuid);

    await Promise.all(
      participants.map((participant) =>
        this.unregister(participant.uuid, event.uuid),
      ),
    );
  }
}
