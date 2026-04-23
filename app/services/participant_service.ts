import { DateTime } from "luxon";

import { Exception } from "@adonisjs/core/exceptions";
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
    participantAttributes?: {
      attributeId: number;
      value: string | string[] | null | undefined;
    }[],
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
      .andWhere("event_id", event.id)
      .select("id", "type", "is_multiple", "max_selections", "name");

    const attributeMap = new Map(attributeTypes.map((attr) => [attr.id, attr]));

    for (const attribute of participantAttributes) {
      const attrConfig = attributeMap.get(attribute.attributeId);
      if (!attrConfig) {
        continue;
      }

      const isBlock = attrConfig.type === "block";
      const rawValues = Array.isArray(attribute.value)
        ? attribute.value
        : [attribute.value];

      // Remove duplicates and nulls if it's an array
      const values = [...new Set(rawValues)].filter(
        (v) => v !== undefined && v !== "" && v !== "null",
      );

      // Handle unregistration (explicit null or empty array)
      if (values.length === 0 || (values.length === 1 && values[0] === null)) {
        results.push({ attributeId: attribute.attributeId, value: null });
        continue;
      }

      // Validation
      if (values.length > 1 && !attrConfig.isMultiple) {
        throw new Exception(
          `Multiple selections are not allowed for attribute ${attrConfig.name}`,
          { status: 400 },
        );
      }

      if (
        attrConfig.maxSelections !== null &&
        values.length > attrConfig.maxSelections
      ) {
        throw new Exception(
          `Maximum ${attrConfig.maxSelections} selections allowed for attribute ${attrConfig.name}`,
          { status: 400 },
        );
      }

      for (const raw of values) {
        let valueToSave: string | null = null;

        if (raw === null) {
          valueToSave = null;
        } else if (isBlock) {
          const blockId = Number(raw);

          if (!Number.isFinite(blockId)) {
            throw new Exception(`Invalid block ID format: "${String(raw)}"`, {
              status: 400,
            });
          }

          const block = await Block.query()
            .where("attribute_id", attribute.attributeId)
            .where("id", blockId)
            .firstOrFail();

          valueToSave = block.id.toString();
        } else {
          valueToSave = String(raw);
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
              "type",
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
