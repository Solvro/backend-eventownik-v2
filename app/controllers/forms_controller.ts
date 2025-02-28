import type { HttpContext } from "@adonisjs/core/http";

import Event from "#models/event";
import Form from "#models/form";
import {
  createFormValidator,
  filledFieldsValidator,
  updateFormValidator,
} from "#validators/form";

export default class FormsController {
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

    const event = await Event.findOrFail(eventId);

    await bouncer.authorize("manage_form", event);

    const { attributes, isFirstForm, ...newFormData } =
      await request.validateUsing(createFormValidator);

    if (isFirstForm && event.firstFormId !== null) {
      return response.badRequest({
        message: "Event already has a registration form",
      });
    }

    const form = await event.related("forms").create(newFormData);

    if (isFirstForm) {
      await form.related("firstForm").save(event);
    }

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
    const event = await Event.findOrFail(eventId);

    await bouncer.authorize("manage_form", event);
    const form = await Form.query()
      .where("event_id", eventId)
      .where("id", formId)
      .firstOrFail();

    const { attributes, isFirstForm, ...updates } =
      await request.validateUsing(updateFormValidator);

    if (
      event.firstFormId !== null &&
      event.firstFormId !== formId &&
      isFirstForm === true
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

    if (isFirstForm === true) {
      await form.related("firstForm").save(event);
    }
    if (isFirstForm === false && event.firstFormId === formId) {
      await event.merge({ firstFormId: null }).save();
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
   * @requiredFields
   * @operationId getMissingRequiredFields
   * @description Returns missing required fields for a given form based on user input
   * @tag forms
   * @requestBody { filledFields: { [key: string]: any } } - User's filled fields
   * @responseBody 200 - { missingRequiredFields: { id: number, name: string }[] }
   * @responseBody 404 - { "message": "Form not found", "name": "Exception", "status": 404 }
   */
  public async requiredFields({ params, request, response }: HttpContext) {
    const formId = +params.id;

    const { filledFields } = await request.validateUsing(filledFieldsValidator);

    const form = await Form.query()
      .where("id", formId)
      .preload("attributes", async (query) => {
        await query.pivotColumns(["is_required"]);
      })
      .firstOrFail();

    const missingRequiredFields = form.attributes
      .filter((attribute) => attribute.$extras.pivot_is_required === true)
      .filter(
        (attribute) =>
          !Object.prototype.hasOwnProperty.call(filledFields, attribute.name),
      )
      .map((attribute) => ({
        id: attribute.id,
        name: attribute.name,
      }));

    return response.json({ missingRequiredFields });
  }
}
