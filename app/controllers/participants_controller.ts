import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";

import Participant from "#models/participant";
import { ParticipantService } from "#services/participant_service";
import {
  participantsStoreValidator,
  participantsUpdateValidator,
  unregisterManyParticipantsValidator,
} from "#validators/participants";

@inject()
export default class ParticipantsController {
  // eslint-disable-next-line no-useless-constructor
  constructor(private participantService: ParticipantService) {}

  /**
   * @index
   * @tag participants
   * @summary Get all participants
   * @description Get all participants and their attributes for specific event
   * @responseBody 200 - [{"id":32,"email":"test@test.pl", "created_at":"yyyy-MM-dd HH:mm:ss", "slug":"9081d217-9e13-4642-b7f0-2b8f8f409dfb","createdAt":"2025-02-19 13:56:10","updatedAt":"2025-02-19 13:56:10","attributes":[{"id":25,"name":"Sample Attribute","value":"sample value","slug":"sample-slug"}]}]
   */
  async index({ params }: HttpContext) {
    const participants = await Participant.query()
      .select("id", "email", "slug", "created_at")
      .where("event_id", params.eventId as number)
      .preload("attributes", (attributesQuery) =>
        attributesQuery
          .select("id", "name", "slug")
          .pivotColumns(["value"])
          .where("show_in_list", true),
      );

    const formattedParticipants = participants.map((participant) => {
      return {
        id: participant.id,
        email: participant.email,
        slug: participant.slug,
        attributes: participant.attributes.map((attribute) => ({
          id: attribute.id,
          name: attribute.name,
          slug: attribute.slug,
          value: attribute.$extras.pivot_value as string,
        })),
        createdAt: participant.createdAt
          .setZone("Europe/Warsaw")
          .toFormat("yyyy-MM-dd HH:mm:ss"),
      };
    });

    return formattedParticipants;
  }

  /**
   * @store
   * @tag participants
   * @summary Create a new participant
   * @description Create a new participant for specific event with optional attributes
   * @requestBody <participantsStoreValidator>
   * @responseBody 201 - <Participant>
   */
  async store({ request, params }: HttpContext) {
    const eventId = +params.eventId;

    const participantCreateDTO = await request.validateUsing(
      participantsStoreValidator,
    );

    const participant = await this.participantService.createParticipant(
      eventId,
      participantCreateDTO,
    );

    return participant;
  }

  /**
   * @show
   * @tag participants
   * @summary Get a participant
   * @description Get a participant and sent emails for specific event
   * @responseBody 200 - {"id": 1,"email":"john.doe@example.com", "created_at":"yyyy-MM-dd HH:mm:ss","slug":"some-unique-slug","createdAt": "2025-02-18T00:56:06.115+01:00","updatedAt": "2025-02-18T00:56:06.115+01:00",    "attributes": [{"id": 25,"name": "Sample Attribute","value": "sample value","slug": "sample-slug"}], "emails":[{"id": 1,"name":"Welcome Email","content":"Welcome to our event!","participantEmails":{"status":"sent","sendBy": "admin","sendAt": "2025-02-19T14:43:12.000+01:00"}  } ] }
   * @responseBody 404 - { message: "Row not found", "name": "Exception", status: 404},
   */
  async show({ params, response }: HttpContext) {
    const findParticipant = await Participant.query().where(
      "id",
      params.id as number,
    );
    if (findParticipant.length === 0) {
      return response.notFound("Participant not found.");
    }

    const participant = await Participant.query()
      .select("id", "email", "slug", "created_at")
      .where("id", +params.id)
      .andWhere("event_id", +params.eventId)
      .preload("attributes", (attributesQuery) =>
        attributesQuery.select("id", "name", "slug").pivotColumns(["value"]),
      )
      .preload("emails", (emailsQuery) =>
        emailsQuery
          .select("id", "name", "content", "trigger", "trigger_value")
          .pivotColumns(["send_by", "send_at", "status"]),
      )
      .firstOrFail();

    const transformedParticipant = {
      id: participant.id,
      email: participant.email,
      slug: participant.slug,
      createdAt: participant.createdAt.toFormat("yyyy-MM-dd HH:mm:ss"),
      attributes: participant.attributes.map((attribute) => ({
        id: attribute.id,
        name: attribute.name,
        slug: attribute.slug,
        value: attribute.$extras.pivot_value as string,
      })),
      emails: participant.emails.map((email) => {
        const { $extras, $original } = email;

        return {
          ...$original,
          sendBy: ($extras.pivot_sent_by as string) || null,
          sendAt: ($extras.pivot_sent_at as string) || null,
          status: $extras.pivot_status as string,
        };
      }),
    };

    return transformedParticipant;
  }

  /**
   * @update
   * @tag participants
   * @summary Update a participant
   * @description Update a participant for specific event with optional attributes
   * @requestBody <participantsUpdateValidator>
   * @responseBody 200 - <Participant>
   */
  async update({ params, request }: HttpContext) {
    const eventId = +params.eventId;
    const participantId = +params.id;

    const updateParticipantDTO = await request.validateUsing(
      participantsUpdateValidator,
    );

    const updatedParticipant = await this.participantService.updateParticipant(
      eventId,
      participantId,
      updateParticipantDTO,
    );

    const transformedUpdatedParticipant = {
      id: updatedParticipant.id,
      email: updatedParticipant.email,
      slug: updatedParticipant.slug,
      attributes: updatedParticipant.attributes.map((attribute) => ({
        id: attribute.id,
        name: attribute.name,
        slug: attribute.slug,
        value: attribute.$extras.pivot_value as string,
      })),
      created_at: updatedParticipant.createdAt.toFormat("yyyy-MM-dd HH:mm:ss"),
    };

    return transformedUpdatedParticipant;
  }

  /**
   * @destroy
   * @tag participants
   * @summary Delete a participant
   * @description Delete a participant for specific event
   * @responseBody 204 - {}
   * @responseBody 404 - { message: "Row not found", "name": "Exception", status: 404},
   */
  async destroy({ params, response }: HttpContext) {
    const participantId = +params.id;
    const eventId = +params.eventId;

    await Participant.query()
      .where("id", participantId)
      .andWhere("event_id", eventId)
      .delete();

    return response.noContent();
  }

  /**
   * @unregister
   * @tag participants
   * @summary Removes a participant from an event
   * @description Removes a participant from an event
   * @responseBody 204 - {}
   * @responseBody 404 - { message: "Row not found", "name": "Exception", status: 404},
   */
  async unregister({ params, response }: HttpContext) {
    const eventSlug = params.eventSlug as string;
    const participantSlug = params.participantSlug as string;

    await this.participantService.unregister(participantSlug, eventSlug);

    return response.noContent();
  }

  /**
   * @unregisterMany
   * @tag participants
   * @summary Removes many participants from an event
   * @description Removes many participants from an event
   * @requestBody <unregisterManyParticipantsValidator>
   * @responseBody 204 - {}
   * @responseBody 404 - { message: "Row not found", "name": "Exception", status: 404},
   */
  async unregisterMany({ params, request, response }: HttpContext) {
    const eventId = +params.eventId;

    const { participantsToUnregisterIds } = await request.validateUsing(
      unregisterManyParticipantsValidator,
    );

    await this.participantService.unregisterMany(
      participantsToUnregisterIds,
      eventId,
    );

    return response.noContent();
  }
}
