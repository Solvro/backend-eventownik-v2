import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import db from "@adonisjs/lucid/services/db";

import Attribute from "#models/attribute";
import Event from "#models/event";
import Participant from "#models/participant";
import { FileService } from "#services/file_service";
import { participantBulkUpdateValidator } from "#validators/participant_attributes";

@inject()
export default class ParticipantsAttributesController {
  // eslint-disable-next-line no-useless-constructor
  constructor(private fileService: FileService) {}

  /**
   * @downloadFile
   * @operationId downloadFile
   * @description Returns attribute file
   * @tag attributes
   * @responseBody 200 - photo
   * @responseBody 400 - { message: "Event doesn't have a photo" }
   */
  public async downloadFile({ params, response, bouncer }: HttpContext) {
    const eventId = +params.eventId;
    const participantId = +params.participantId;
    const attributeId = +params.attributeId;

    await bouncer.authorize(
      "manage_participant",
      await Event.findOrFail(eventId),
    );

    const participant = await Participant.query()
      .where("id", participantId)
      .andWhere("event_id", eventId)
      .first();

    if (participant === null) {
      return response.badRequest({
        message: "Participant doesn't exists",
      });
    }

    const { participantAttributes } = await Attribute.query()
      .where("id", attributeId)
      .preload("participantAttributes", (participantAttributesQuery) =>
        participantAttributesQuery
          .where("participant_id", participantId)
          .pivotColumns(["value"]),
      )
      .firstOrFail();

    const filename = participantAttributes[0].$extras.pivot_value as string;

    const filePath = await this.fileService.getFileAbsolutePath(filename);

    if (filePath !== undefined) {
      return response.download(filePath);
    } else {
      response.notFound({ message: "Attribute doesn't have a file" });
    }
  }

  async bulkUpdate({ params, request, bouncer, response }: HttpContext) {
    const eventId = +params.eventId;
    const payload = await request.validateUsing(participantBulkUpdateValidator);
    const attributeId = +payload.attribute_id;
    const newValue = payload.value;
    const participantIds = payload.id;
    const event = await Event.findOrFail(eventId);

    await bouncer.authorize("manage_participant", event);

    await event
      .related("attributes")
      .query()
      .where("id", attributeId)
      .firstOrFail();
    const foundParticipants = await event
      .related("participants")
      .query()
      .whereIn("id", participantIds);

    if (foundParticipants.length !== participantIds.length) {
      const foundParticipantIds = foundParticipants.map(
        (participant) => participant.id,
      );
      const missingIds = participantIds.filter(
        (id) => !foundParticipantIds.includes(id),
      );
      return response.notFound(
        `Participants with ID [${missingIds.join(",")}] not found.`,
      );
    }

    const query = db
      .from("participant_attributes")
      .where("attribute_id", attributeId)
      .andWhereIn("participant_id", participantIds);

    const foundAttributes = await query.select("participant_id");

    const foundParticipantIds = foundAttributes.map(
      (attribute: { participant_id: number }) => attribute.participant_id,
    );
    const missingIds = participantIds.filter(
      (id) => !foundParticipantIds.includes(id),
    );
    if (missingIds.length !== 0) {
      return response.notFound(
        `Attributes for participants with ID [${missingIds.join(",")}] not found.`,
      );
    }

    await query.update({
      value: newValue,
    });

    return response.noContent();
  }
}
