import { HttpContext } from "@adonisjs/core/http";

import Participant from "#models/participant";
import ParticipantAttribute from "#models/participant_attribute";
import {
  participantsStoreValidator,
  participantsUpdateValidator,
} from "#validators/participants";

interface Attribute {
  id: number;
  attribute: {
    name: string;
    slug: string;
  };
  value: string;
}

export default class ParticipantsController {
  /**
   * @index
   * @tag participants
   * @summary Get all participants
   * @description Get all participants and their attributes for specific event
   * @responseBody 200 - [{"id":32,"email":"test@test.pl","firstName":"name","lastName":"last name","slug":"9081d217-9e13-4642-b7f0-2b8f8f409dfb","createdAt":"2025-02-19 13:56:10","updatedAt":"2025-02-19 13:56:10","attributes":[{"id":25,"name":"Sample Attribute","value":"sample value","slug":"sample-slug"}]}]
   */
  async index({ params, request, response }: HttpContext) {
    const page = request.input("page", 1) as number;
    const limit = request.input("limit", 10) as number;
    const participants = await Participant.query()
      .where("event_id", params.eventId as number)
      .preload("participantAttributes", (query) => {
        query
          .select("id", "attribute_id", "value", "participant_id")
          .preload("attribute", (attributeQuery) => {
            attributeQuery
              .select("name", "slug")
              .where("show_in_list", true)
              .catch((error) => {
                return response.badRequest({
                  message: (error as Error).message,
                });
              });
          })
          .catch((error) => {
            return response.badRequest({ message: (error as Error).message });
          });
      })
      .paginate(page, limit);
    const serializedParticipants = participants.serialize({
      fields: {
        omit: ["eventId"],
      },
      relations: {
        participant_attributes: {
          fields: ["id", "value"],
          relations: {
            attribute: {
              fields: ["id", "name", "slug"],
            },
          },
        },
      },
    });

    const participantsJson = serializedParticipants.data.map((participant) => {
      return {
        id: participant.id as number,
        email: participant.email as string,
        firstName: participant.firstName as string,
        lastName: participant.lastName as string,
        slug: participant.slug as string,
        createdAt: participant.createdAt as string,
        updatedAt: participant.updatedAt as string,
        attributes: (participant.participant_attributes as []).map(
          (attribute: Attribute) => {
            return {
              id: attribute.id,
              name: attribute.attribute.name,
              value: attribute.value,
              slug: attribute.attribute.slug,
            };
          },
        ),
      };
    });

    return participantsJson;
  }

  /**
   * @store
   * @tag participants
   * @summary Create a new participant
   * @description Create a new participant for specific event with optional attributes
   * @requestBody <participantsStoreValidator>
   * @responseBody 201 - <Participant>
   */
  async store({ request, response, params }: HttpContext) {
    const participantData = await participantsStoreValidator.validate(
      request.all(),
    );
    const participantAttributes = participantData.participantAttributes;
    delete participantData.participantAttributes;
    participantData.eventId = params.eventId as number;
    const participant = await Participant.create(participantData);
    if (
      participantAttributes !== undefined &&
      participantAttributes.length > 0
    ) {
      await participant
        .related("participantAttributes")
        .createMany(participantAttributes)
        .catch((error) => {
          return response.badRequest({ message: (error as Error).message });
        });
    }

    return response.status(201).send(participant);
  }

  /**
   * @show
   * @tag participants
   * @summary Get a participant
   * @description Get a participant and sent emails for specific event
   * @responseBody 200 - {"id": 1,"email":"john.doe@example.com","firstName": "John","lastName": "Doe","slug":"some-unique-slug","createdAt": "2025-02-18T00:56:06.115+01:00","updatedAt": "2025-02-18T00:56:06.115+01:00","emails":[{"id": 1,"name":"Welcome Email","content":"Welcome to our event!","participantEmails":{"status":"sent","sendBy": "admin","sendAt": "2025-02-19T14:43:12.000+01:00"}         }     ] }
   * @responseBody 404 - {"message" : "Participant not found."}
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
      .where("id", params.id as number)
      .preload("participantEmails", (query) => {
        query
          .where("status", "sent")
          .preload("email", (emailQuery) => {
            emailQuery
              .where("event_id", params.eventId as number)
              .catch((error) => {
                return response.badRequest({
                  message: (error as Error).message,
                });
              });
          })
          .catch((error) => {
            return response.badRequest({ message: (error as Error).message });
          });
      });

    if (participant[0].eventId !== Number.parseInt(params.eventId as string)) {
      return response.notFound("Participant not found.");
    }
    const participantJson = participant.map((participantBuilder) => {
      return {
        id: participantBuilder.id,
        email: participantBuilder.email,
        firstName: participantBuilder.firstName,
        lastName: participantBuilder.lastName,
        slug: participantBuilder.slug,
        createdAt: participantBuilder.createdAt.toFormat("yyyy-MM-dd HH:mm:ss"),
        updatedAt: participantBuilder.updatedAt.toFormat("yyyy-MM-dd HH:mm:ss"),
        emails: participantBuilder.participantEmails.map((participantEmail) => {
          return {
            id: participantEmail.email.id,
            name: participantEmail.email.name,
            content: participantEmail.email.content,
            status: participantEmail.status,
            sendBy: participantEmail.sendBy,
            sendAt: participantEmail.sendAt?.toFormat("yyyy-MM-dd HH:mm:ss"),
          };
        }),
      };
    });
    return participantJson;
  }

  /**
   * @update
   * @tag participants
   * @summary Update a participant
   * @description Update a participant for specific event with optional attributes
   * @responseBody 200 - <Participant>
   * @requestBody <participantsUpdateValidator>
   */
  async update({ params, request }: HttpContext) {
    const participant = await Participant.findOrFail(params.id);
    const participantData = await participantsUpdateValidator.validate(
      request.all(),
    );
    const participantAttributes = participantData.participantAttributes;
    delete participantData.participantAttributes;
    participant.merge(participantData);

    if (
      participantAttributes !== undefined &&
      participantAttributes.length > 0
    ) {
      for (const participantAttribute of participantAttributes) {
        const attribute = await ParticipantAttribute.findOrFail(
          participantAttribute.id,
        );
        if (attribute.participantId === participant.id) {
          attribute.merge(participantAttribute);
          await attribute.save();
        }
      }
    }
    await participant.save();
    return { message: `Participant successfully updated.`, participant };
  }

  /**
   * @destroy
   * @tag participants
   * @summary Delete a participant
   * @description Delete a participant for specific event
   * @responseBody 200 - {"message" : "Participant successfully deleted."}
   * @responseBody 404 - {"message" : "Participant not found in this event."}
   */
  async destroy({ params, response }: HttpContext) {
    const participant = await Participant.findOrFail(params.id);
    if (participant.eventId === Number.parseInt(params.eventId as string)) {
      await ParticipantAttribute.query()
        .where("participant_id", params.id as number)
        .delete();
      await participant.delete();
      return { message: `Participant successfully deleted.` };
    }
    return response.notFound("Participant not found.");
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
