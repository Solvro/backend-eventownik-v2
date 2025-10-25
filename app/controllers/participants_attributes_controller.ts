import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

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
    const eventId = params.eventId as string;
    const participantId = params.participantId as string;
    const attributeId = params.attributeId as string;

    await bouncer.authorize(
      "manage_participant",
      await Event.findOrFail(eventId),
    );

    const participant = await Participant.query()
      .where("uuid", participantId)
      .andWhere("eventUuid", eventId)
      .first();

    if (participant === null) {
      return response.badRequest({
        message: "Participant doesn't exists",
      });
    }

    const { participantAttributes } = await Attribute.query()
      .where("uuid", attributeId)
      .preload("participantAttributes", (participantAttributesQuery) =>
        participantAttributesQuery
          .where("participantUuid", participantId)
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
    const eventId = params.eventId as string;
    const attributeId = params.attributeId as string;
    const { newValue, participantIds } = await request.validateUsing(
      participantBulkUpdateValidator,
      {
        meta: {
          eventId,
        },
      },
    );

    await bouncer.authorize(
      "manage_participant",
      await Event.findOrFail(eventId),
    );

    const updatedParticipantAttributes = participantIds.reduce<
      Record<number, { value: string }>
    >((acc, id) => {
      acc[id] = { value: newValue };
      return acc;
    }, {});

    const attribute = await Attribute.findOrFail(attributeId);
    await attribute
      .related("participantAttributes")
      .sync(updatedParticipantAttributes, false);

    return response.noContent();
  }
}
