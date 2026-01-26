import db from "@adonisjs/lucid/services/db";

import Block from "#models/block";
import Event from "#models/event";
import Participant from "#models/participant";

import {
  CreateParticipantDTO,
  UpdateParticipantDTO,
} from "../types/participant_types.js";
import { EmailService } from "./email_service.js";

export class ParticipantService {
  private async prepareAttributesForSave(
    event: Event,
    participant: Participant,
    participantAttributes?: { attributeId: number; value: string | null }[],
  ): Promise<Record<number, { value: string | null }>> {
    const transformedAttributes: Record<number, { value: string | null }> = {};

    if (participantAttributes === undefined) {
      return transformedAttributes;
    }

    if (participantAttributes.length === 0) {
      return transformedAttributes;
    }

    const attributeIds = participantAttributes.map((attr) => attr.attributeId);

    const attributesQuery = event.related("attributes").query();

    const blockAttributes = await attributesQuery
      .whereIn("id", attributeIds)
      .andWhere("type", "block")
      .select("id");

    const blockAttributeIds = new Set<number>(
      blockAttributes.map((attr) => attr.id),
    );

    for (const attribute of participantAttributes) {
      const isBlock = blockAttributeIds.has(attribute.attributeId);
      let valueToSave: string | null | undefined = attribute.value;

      if (isBlock) {
        const raw = attribute.value;

        if (raw === null || raw === undefined || raw === "" || raw === "null") {
          valueToSave = null;
        } else {
          const blockId = Number(raw);

          if (!Number.isFinite(blockId)) {
            throw new Error(`Invalid block ID format: "${raw}"`);
          }

          const block = await Block.find(blockId);
          if (block === null) {
            throw new Error(`Block with ID ${blockId} does not exist.`);
          }

          valueToSave = blockId.toString();
        }
      }

      if (valueToSave === undefined) {
        continue;
      }

      await EmailService.sendOnTrigger(
        event,
        participant,
        "attribute_changed",
        attribute.attributeId,
        valueToSave,
      );

      transformedAttributes[attribute.attributeId] = {
        value: valueToSave,
      };
    }

    return transformedAttributes;
  }

  async createParticipant(
    eventId: number,
    createParticipantDTO: CreateParticipantDTO,
  ): Promise<Participant> {
    const { participantAttributes, ...participantData } = createParticipantDTO;

    return await db.transaction(async (trx) => {
      const event = await Event.findOrFail(eventId, { client: trx });

      const participant = await event
        .related("participants")
        .create(participantData, { client: trx });

      const transformedAttributes = await this.prepareAttributesForSave(
        event,
        participant,
        participantAttributes,
      );

      if (Object.keys(transformedAttributes).length > 0) {
        await participant
          .related("attributes")
          .attach(transformedAttributes, trx);
      }

      await participant.load("attributes");

      await EmailService.sendOnTrigger(
        event,
        participant,
        "participant_registered",
      );

      return participant;
    });
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

    const transformedAttributes = await this.prepareAttributesForSave(
      event,
      participant,
      participantAttributes,
    );

    if (Object.keys(transformedAttributes).length > 0) {
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

  async unregisterMany(participantsToUnregisterIds: number[], eventId: number) {
    const event = await Event.findOrFail(+eventId);

    const participantsQuery = Participant.query()
      .whereIn("id", participantsToUnregisterIds)
      .andWhere("event_id", event.id);

    const participants = await participantsQuery;

    await Promise.all(
      participants.map((participant) =>
        this.unregister(participant.slug, event.slug),
      ),
    );
  }
}
