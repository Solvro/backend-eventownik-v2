import { inject } from "@adonisjs/core";

import Event from "#models/event";
import Form from "#models/form";
import Participant from "#models/participant";

import { FormSubmitDTO } from "../types/form_types.js";
import { filterObjectFields } from "../utils/filter_object_fields.js";
import { ParticipantService } from "./participant_service.js";

@inject()
export class FormService {
  // eslint-disable-next-line no-useless-constructor
  constructor(private participantService: ParticipantService) {}

  async submitForm(
    eventSlug: string,
    formId: number,
    formSubmitDTO: FormSubmitDTO,
  ): Promise<void | { status: number; error: object }> {
    const event = await Event.findByOrFail("slug", eventSlug);

    const form = await Form.query()
      .where("id", formId)
      .andWhere("event_id", event.id)
      .preload("attributes", async (query) => {
        await query.pivotColumns(["is_required"]);
      })
      .firstOrFail();

    if (form.isFirstForm && formSubmitDTO.email === undefined) {
      return {
        status: 400,
        error: { missingRequiredFields: { name: "email" } },
      };
    } else if (
      !form.isFirstForm &&
      formSubmitDTO.participantSlug === undefined
    ) {
      return {
        status: 400,
        error: { missingRequiredFields: { name: "participantSlug" } },
      };
    }

    const allowedFieldsIds = form.attributes.map((attribute) =>
      attribute.id.toString(),
    );

    const missingRequiredFields = form.attributes
      .filter((attribute) => attribute.$extras.pivot_is_required === true)
      .filter((attribute) => !(attribute.id in formSubmitDTO.attributes))
      .map((attribute) => ({
        id: attribute.id,
        name: attribute.name,
      }));

    if (missingRequiredFields.length > 0) {
      return {
        status: 400,
        error: { missingRequiredFields },
      };
    }

    const formFields = filterObjectFields(
      formSubmitDTO.attributes,
      allowedFieldsIds,
    );

    const transformedFormFields = Object.entries(formFields).map(
      ([key, value]) => ({ attributeId: +key, value: value as string }),
    );

    if (formSubmitDTO.email !== undefined) {
      await this.participantService.createParticipant(event.id, {
        email: formSubmitDTO.email,
        participantAttributes: transformedFormFields,
      });
    } else if (formSubmitDTO.participantSlug !== undefined) {
      const participant = await Participant.findByOrFail(
        "slug",
        formSubmitDTO.participantSlug,
      );
      await this.participantService.updateParticipant(
        event.id,
        participant.id,
        { email: undefined, participantAttributes: transformedFormFields },
      );
    }
  }
}
