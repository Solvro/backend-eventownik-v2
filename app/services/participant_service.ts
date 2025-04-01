import Event from "#models/event";
import Participant from "#models/participant";

import {
  CreateParticipantDTO,
  UpdateParticipantDTO,
} from "../types/participant_types.js";
import { EmailService } from "./email_service.js";

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
      const transformedAttributes: Record<number, { value: string }> = {};

      for (const attribute of participantAttributes) {
        await EmailService.sendOnTrigger(
          event,
          participant,
          "attribute_changed",
          attribute.attributeId,
          attribute.value,
        );
        transformedAttributes[attribute.attributeId] = {
          value: attribute.value,
        };
      }

      await participant.related("attributes").attach(transformedAttributes);
    }

    await participant.load("attributes");

    await EmailService.sendOnTrigger(
      event,
      participant,
      "participant_registered",
    );

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

    const event = await Event.findOrFail(eventId);

    participant.merge(updates);
    await participant.save();

    if (
      participantAttributes !== undefined &&
      participantAttributes.length > 0
    ) {
      const transformedAttributes: Record<number, { value: string }> = {};

      for (const attribute of participantAttributes) {
        await EmailService.sendOnTrigger(
          event,
          participant,
          "attribute_changed",
          attribute.attributeId,
          attribute.value,
        );
        transformedAttributes[attribute.attributeId] = {
          value: attribute.value,
        };
      }

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

  async unregister(participantSlug: string, eventSlug: string) {
    const event = await Event.findByOrFail("slug", eventSlug);

    const participant = await Participant.query()
      .where("slug", participantSlug)
      .andWhere("event_id", event.id)
      .firstOrFail();

    await EmailService.sendOnTrigger(event, participant, "participant_deleted");

    await participant.delete();
  }
}
