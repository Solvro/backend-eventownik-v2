import { HttpContext } from "@adonisjs/core/http";

import Participant from "#models/participant";
import ParticipantAttribute from "#models/participant_attribute";
import { participantAttributesStoreValidator, participantAttributesUpdateValidator } from "#validators/participant_attributes";
import {
  participantsStoreValidator,
  participantsUpdateValidator,
  participantsStoreValidatorSchema,
  participantsUpdateValidatorSchema
} from "#validators/participants";

export default class ParticipantsController {
  /**
   * @index
   * @tag participants
   * @summary Get all participants
   * @description Get all participants and their attributes for specific event
   * @responseBody 200 - [{"id":32,"email":"test@test.pl","firstName":"name","lastName":"last name","slug":"9081d217-9e13-4642-b7f0-2b8f8f409dfb","createdAt":"2025-02-19 13:56:10","updatedAt":"2025-02-19 13:56:10","attributes":[{"id":25,"name":"Sample Attribute","value":"sample value","slug":"sample-slug"}]}]
  */
  async index({ params, request }: HttpContext) {
  const page = request.input('page', 1);
  const limit = request.input('limit', 10);
  const participants = await Participant.query()
    .where('event_id', params.event_id)
    .preload('participant_attributes', (query) => {
      query
        .select('id', 'attribute_id', 'value', 'participant_id')
        .preload('attribute', (attributeQuery) => {
          attributeQuery
          .select('name', "slug")
          .where('show_in_list', true);
        });
    })
    .paginate(page, limit);
  const serialized_participants = participants.serialize({
    fields: {
      omit: ["eventId"]
    },
    relations:{
      participant_attributes:{
        fields: ["id","value"],
        relations: {
          attribute: {
            fields: ["id", "name", "slug"]
          }
        }
      }
    }
}
);
  const participantsJson = serialized_participants.data.map((participants) => {
    return {
      id: participants.id,
      email: participants.email,
      firstName: participants.firstName,
      lastName: participants.lastName,
      slug: participants.slug,
      createdAt: participants.createdAt,
      updatedAt: participants.updatedAt,
      attributes: participants.participant_attributes.map((attribute: any) => {
        return {
          id: attribute.id,
          name: attribute.attribute.name,
          value: attribute.value,
          slug: attribute.attribute.slug
        }
      })
    }
  })
  return participantsJson;
}

  /**
   * @store
   * @tag participants
   * @summary Create a new participant
   * @description Create a new participant for specific event with optional attributes
   * @requestBody <participantsStoreValidatoSchemar>
   * @responseBody 201 - <Participant>
   */
  async store({ request, response }: HttpContext) {
    const participant_data = await participantsStoreValidator.validate(request.all());
    const participant_attributes = await participantAttributesStoreValidator.validate(request.all());
    participant_data.eventId = request.params().event_id;
    const participant = await Participant.create(participant_data);
    // participant.related('participant_attributes').createMany(request.body()['participant_attributes']);
    const participantAttributes = request.body()['participant_attributes'];

    for (const attribute of participantAttributes ){
      const attribute_data = await participantAttributesStoreValidator.validate(
      {"participantId": participant.id,
       "attributeId": attribute['attributeId'],
        "value": attribute['value']
      }
    );
    await ParticipantAttribute.create(attribute_data);
    }

    participant.related('participant_attributes').createMany(participant_attributes.participantAttributes);
    return response.status(201).send(participant);
  }

  /**
   * @show
   * @tag participants
   * @summary Get a participant
   * @description Get a participant and sent emails for specific event
   * @responseBody 201 - {"id": 1,"email":"john.doe@example.com","firstName": "John","lastName": "Doe","slug":"some-unique-slug","createdAt": "2025-02-18T00:56:06.115+01:00","updatedAt": "2025-02-18T00:56:06.115+01:00","emails":[{"id": 1,"name":"Welcome Email","content":"Welcome to our event!","participantEmails":{"status":"sent","sendBy": "admin","sendAt": "2025-02-19T14:43:12.000+01:00"}         }     ] }
   * @responseBody 404 - {"message" : "Participant not found."}
   */
  async show({ params, response }: HttpContext) {

    const find_participant = await Participant.query()
    .where('id',params.id)
    if (find_participant.length == 0){
      return response.status(404).send({ message: `Participant not found` });
    }

    const participant = await Participant.query()
    .where('id',params.id)
    .preload('participant_emails', (query) => {
      query
      .where('status', 'sent')
      .preload('email', (emailQuery) => {
        emailQuery
        .where('event_id', params.event_id)
      })
    })
    if (participant[0].eventId != params.event_id){
        return response.status(404).send({ message: `Participant not found` });
      }
    const participantJson = participant.map((participant) => {
      return {
        id: participant.id,
        email: participant.email,
        firstName: participant.firstName,
        lastName: participant.lastName,
        slug: participant.slug,
        createdAt: participant.createdAt.toFormat("yyyy-MM-dd HH:mm:ss"),
        updatedAt: participant.updatedAt.toFormat("yyyy-MM-dd HH:mm:ss"),
        emails : participant.participant_emails.map((participant_email: any) => {
          return {
            id: participant_email.email.id,
            name: participant_email.email.name,
            content: participant_email.email.content,
              status: participant_email.status,
              sendBy: participant_email.sendBy,
              sendAt: participant_email.sendAt.toFormat("yyyy-MM-dd HH:mm:ss")
          }
        })
      }
    })

    return participantJson;
  }

  /**
   * @update
   * @tag participants
   * @summary Update a participant
   * @description Update a participant for specific event with optional attributes
   * @responseBody 200 - <Participant>
   * @requestBody <participantsUpdateValidatorSchema>
   */
  async update({ params, request }: HttpContext) {
    const participant_data = await participantsUpdateValidator.validate(request.all());
    const participant = await Participant.findOrFail(params.id);
    participant.merge(participant_data);

    const participant_attributes = await participantAttributesUpdateValidator.validate(request.all());
    if (participant_attributes.participantAttributes){
      for (const participant_attribute of participant_attributes.participantAttributes){
        console.log(participant_attribute);
        const attribute = await ParticipantAttribute.findOrFail(participant_attribute.id);
        if (attribute.participantId == participant.id){
          attribute.merge(participant_attribute);
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
    if (participant.eventId == params.event_id) {
          await ParticipantAttribute.query().where('participant_id', params.id).delete();
          await participant.delete();
          return { message: `Participant successfully deleted.` };
    }
    return response.status(404).send({ message: `Participant does not belong to this event.` });
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
