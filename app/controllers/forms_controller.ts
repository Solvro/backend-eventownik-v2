import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

import Event from "#models/event";
import Form from "#models/form";
import { FormService } from "#services/form_service";
import {
  createFormValidator,
  formSubmitValidator,
  updateFormValidator,
} from "#validators/form";

@inject()
export default class FormsController {
  // eslint-disable-next-line no-useless-constructor
  constructor(private formService: FormService) {}

  /**
   * @index
   * @operationId getForms
   * @description Returns an array of event forms
   * @tag forms
   * @responseBody 200 - <Form[]>.with(relations, attributes).exclude(event).paginated("data", "meta")
   */
  public async index({ params, request, bouncer }: HttpContext) {
    const eventId = Number(params.eventId);
    await bouncer.authorize("manage_form", await Event.findOrFail(eventId));
    const page = Number(request.input("page", 1));
    const perPage = Number(request.input("perPage", 10));

    return await Form.query()
      .where("event_id", eventId)
      .preload("attributes")
      .paginate(page, perPage);
  }

  /**
   * @store
   * @operationId createForm
   * @description Creates a form for the specified event
   * @tag forms
   * @requestBody <createFormValidator>
   * @responseBody 201 - <Form>
   */
  public async store({ params, request, response, bouncer }: HttpContext) {
    const eventId = Number(params.eventId);

    const event = await Event.query()
      .where("id", eventId)
      .preload("firstForm")
      .firstOrFail();

    await bouncer.authorize("manage_form", event);

    const { attributes, ...newFormData } =
      await request.validateUsing(createFormValidator);

    if (newFormData.isFirstForm === true && event.firstForm.length !== 0) {
      return response.badRequest({
        message: "Event already has a registration form",
      });
    }

    const form = await event.related("forms").create(newFormData);

    await form.related("attributes").attach(
      attributes.reduce(
        (acc, attribute) => {
          acc[attribute.id] = {
            is_required: attribute.isRequired,
            is_editable: attribute.isEditable,
          };
          return acc;
        },
        {} as Record<number, { is_required?: boolean; is_editable?: boolean }>,
      ),
    );

    return response.created(
      await Form.query()
        .where("id", form.id)
        .andWhere("event_id", eventId)
        .preload("attributes"),
    );
  }

  /**
   * @show
   * @operationId getForm
   * @description Returns a form
   * @tag forms
   * @responseBody 200 - <Form>.with(relations, attributes).exclude(event)
   * @responseBody 404 - { message: "Row not found", "name": "Exception", status: 404},
   */
  public async show({ params, bouncer }: HttpContext) {
    const eventId = Number(params.eventId);
    const formId = Number(params.id);
    await bouncer.authorize("manage_form", await Event.findOrFail(eventId));

    return await Form.query()
      .where("event_id", eventId)
      .where("id", formId)
      .preload("attributes")
      .firstOrFail();
  }

  /**
   * @update
   * @operationId updateForm
   * @description Updates form details
   * @requestBody <updateFormValidator>
   * @responseBody 200 - <Form>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   * @tag forms
   */
  public async update({ params, request, bouncer, response }: HttpContext) {
    const eventId = Number(params.eventId);
    const formId = Number(params.id);
    const event = await Event.query()
      .where("id", eventId)
      .preload("firstForm")
      .firstOrFail();

    await bouncer.authorize("manage_form", event);
    const form = await Form.query()
      .where("event_id", eventId)
      .where("id", formId)
      .firstOrFail();

    const { attributes, ...updates } =
      await request.validateUsing(updateFormValidator);

    if (
      event.firstForm.length !== 0 &&
      form.isFirstForm === false &&
      updates.isFirstForm === true
    ) {
      return response.badRequest({
        message: "Event already has a registration form",
      });
    }

    form.merge(updates);
    await form.save();

    if (attributes !== undefined) {
      await form.related("attributes").detach();

      await form.related("attributes").attach(
        attributes.reduce(
          (acc, attribute) => {
            acc[attribute.id] = {
              is_required: attribute.isRequired,
              is_editable: attribute.isEditable,
            };
            return acc;
          },
          {} as Record<
            number,
            { is_required?: boolean; is_editable?: boolean }
          >,
        ),
      );
    }

    const updatedForm = await Form.query()
      .where("event_id", eventId)
      .where("id", formId)
      .preload("attributes")
      .firstOrFail();

    return updatedForm;
  }

  /**
   * @destroy
   * @operationId deleteForm
   * @description Deletes a form
   * @tag forms
   * @responseBody 204 - {}
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  public async destroy({ params, response, bouncer }: HttpContext) {
    const eventId = Number(params.eventId);
    const formId = Number(params.id);
    await bouncer.authorize("manage_form", await Event.findOrFail(eventId));

    await Form.query()
      .where("event_id", eventId)
      .andWhere("id", formId)
      .delete();

    return response.noContent();
  }

  /**
   * @submitForm
   * @operationId submitForm
   * @description Returns missing required fields for a given form based on user input
   * @tag forms
   * @requestBody { filledFields: { [key: string]: any } } - User's filled fields
   * @responseBody 200 - { missingRequiredFields: { id: number, name: string }[] }
   * @responseBody 404 - { "message": "Form not found", "name": "Exception", "status": 404 }
   */
  public async submitForm({ params, request, response }: HttpContext) {
    const formId = +params.id;
    const eventSlug = params.eventSlug as string;

    const event = await Event.findByOrFail("slug", eventSlug);

    const formFields = await request.validateUsing(formSubmitValidator, {
      meta: { eventId: event.id },
    });

    const errorObject = await this.formService.submitForm(
      eventSlug,
      formId,
      formFields,
    );

    if (errorObject !== undefined) {
      return response.status(errorObject.status).json(errorObject.error);
    }

    return response.created();
  }
}
