import { DateTime } from "luxon";

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
  ): Promise<{ attributeId: number; value: string | null }[]> {
    const results: { attributeId: number; value: string | null }[] = [];

    if (
      participantAttributes === undefined ||
      participantAttributes.length === 0
    ) {
      return results;
    }

    const attributeIds = participantAttributes.map((attr) => attr.attributeId);

    const attributeTypes = await event
      .related("attributes")
      .query()
      .whereIn("id", attributeIds)
      .select("id", "type");

    const blockAttributeIds = new Set<number>(
      attributeTypes
        .filter((attr) => attr.type === "block")
        .map((attr) => attr.id),
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

      results.push({
        attributeId: attribute.attributeId,
        value: valueToSave,
      });
    }

    return results;
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

      if (transformedAttributes.length > 0) {
        const now = DateTime.now().toSQL();
        await trx.table("participant_attributes").insert(
          transformedAttributes
            .filter((attr) => attr.value !== null)
            .map((attr) => ({
              participant_id: participant.id,
              attribute_id: attr.attributeId,
              value: attr.value,
              created_at: now,
              updated_at: now,
            })),
        );
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

    return await db.transaction(async (trx) => {
      const participant = await Participant.query({ client: trx })
        .where("id", participantId)
        .andWhere("event_id", eventId)
        .firstOrFail();

      const event = await Event.findOrFail(eventId, { client: trx });

      participant.merge(updates);
      await participant.save();

      const transformedAttributes = await this.prepareAttributesForSave(
        event,
        participant,
        participantAttributes,
      );

      if (transformedAttributes.length > 0) {
        const attributeIds = [
          ...new Set(transformedAttributes.map((attr) => attr.attributeId)),
        ];

        await trx
          .from("participant_attributes")
          .where("participant_id", participant.id)
          .whereIn("attribute_id", attributeIds)
          .delete();

        const attributesToInsert = transformedAttributes.filter(
          (attr) => attr.value !== null,
        );

        if (attributesToInsert.length > 0) {
          const now = DateTime.now().toSQL();
          await trx.table("participant_attributes").insert(
            transformedAttributes.map((attr) => ({
              participant_id: participant.id,
              attribute_id: attr.attributeId,
              value: attr.value,
              created_at: now,
              updated_at: now,
            })),
          );
        }
      }

      const updatedParticipant = await Participant.query({ client: trx })
        .where("id", participantId)
        .where("event_id", eventId)
        .preload("attributes", (attributesQuery) =>
          attributesQuery
            .select(
              "id",
              "name",
              "slug",
              "is_multiple",
              "created_at",
              "updated_at",
            )
            .pivotColumns(["value"])
            .where("show_in_list", true),
        )
        .firstOrFail();

      return updatedParticipant;
    });
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
