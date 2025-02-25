import { HttpContext } from "@adonisjs/core/http";

import Participant from "#models/participant";
import {
  participantsStoreValidator,
  participantsUpdateValidator,
} from "#validators/participants";

export default class ParticipantsController {
  /**
   * @index
   * @tag participants
   * @summary Get all participants
   * @description Get all participants and their attributes for specific event
   * @responseBody 200 - [{"id":32,"email":"test@test.pl","slug":"9081d217-9e13-4642-b7f0-2b8f8f409dfb","createdAt":"2025-02-19 13:56:10","updatedAt":"2025-02-19 13:56:10","attributes":[{"id":25,"name":"Sample Attribute","value":"sample value","slug":"sample-slug"}]}]
   */
  async index({ params }: HttpContext) {
    const participants = await Participant.query()
      .select("id", "email", "slug")
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
    const { participantAttributes, ...participantData } =
      await request.validateUsing(participantsStoreValidator);

    participantData.eventId = +params.eventId;

    const participant = await Participant.create(participantData);

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

    return participant;
  }

  /**
   * @show
   * @tag participants
   * @summary Get a participant
   * @description Get a participant and sent emails for specific event
   * @responseBody 200 - {"id": 1,"email":"john.doe@example.com","firstName": "John","lastName": "Doe","slug":"some-unique-slug","createdAt": "2025-02-18T00:56:06.115+01:00","updatedAt": "2025-02-18T00:56:06.115+01:00","emails":[{"id": 1,"name":"Welcome Email","content":"Welcome to our event!","participantEmails":{"status":"sent","sendBy": "admin","sendAt": "2025-02-19T14:43:12.000+01:00"}         }     ] }
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
      .select("id", "email", "firstName", "lastName", "slug")
      .where("id", +params.id)
      .andWhere("event_id", +params.eventId)
      .preload("emails", (emailsQuery) =>
        emailsQuery.select("id", "name", "content", "trigger", "trigger_value"),
      );

    return participant;
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
    const participantId = +params.id;
    const eventId = +params.eventId;
    const participant = await Participant.query()
      .where("id", participantId)
      .andWhere("event_id", eventId)
      .firstOrFail();

    const { participantAttributes, ...updates } = await request.validateUsing(
      participantsUpdateValidator,
    );

    participant.merge(updates);
    await participant.save();

    if (
      participantAttributes !== undefined &&
      participantAttributes.length > 0
    ) {
      // Transform permissions to match database schema: event_id instead of eventId
      const transformedAttributes = Object.fromEntries(
        participantAttributes.map((participantAttribute) => [
          participantAttribute.id,
          { value: participantAttribute.value },
        ]),
      );

      await participant.related("attributes").sync(transformedAttributes);
    }

    const updatedParticipant = await Participant.query()
      .where("id", participantId)
      .andWhere("event_id", eventId)
      .firstOrFail();

    return updatedParticipant;
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

  async attachEmail({ params, request, response }: HttpContext) {
    const participant = await Participant.findOrFail(params.id);

    const emailId = request.input("email_id") as number;
    const pivotData = request.only(["send_at", "send_by", "status"]) as {
      send_at?: string;
      send_by?: string;
      status?: string;
    };

    // const email = await Email.findOrFail(emailId);

    await participant.related("emails").attach({ [emailId]: pivotData });

    return response.status(201).send({ message: "Email successfully sent" });
  }
}
