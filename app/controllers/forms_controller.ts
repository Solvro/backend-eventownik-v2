import type { HttpContext } from "@adonisjs/core/http";

import Attribute from "#models/attribute";
import Event from "#models/event";
import Form from "#models/form";
import { createFormValidator, updateFormValidator } from "#validators/form";

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

    await bouncer.authorize("manage_form", await Event.findOrFail(eventId));

    const { attributes, ...newFormData } =
      await request.validateUsing(createFormValidator);

    const form = await Form.create({ ...newFormData, eventId });
    const attribute = await Attribute.find(1);

    await form.related("attributes").attach({
      [attribute.id]: {
        is_required: "true",
      },
    });

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
  public async update({ params, request, bouncer }: HttpContext) {
    const eventId = Number(params.eventId);
    const formId = Number(params.id);
    await bouncer.authorize("manage_form", await Event.findOrFail(eventId));

    const form = await Form.query()
      .where("event_id", eventId)
      .where("id", formId)
      .firstOrFail();

    const { attributesIds, ...updates } =
      await request.validateUsing(updateFormValidator);

    form.merge(updates);

    await form.save();

    if (attributesIds !== undefined) {
      await form.related("attributes").sync(attributesIds);
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
   * @operationId getRequiredFields
   * @description Returns required fields for a given form
   * @tag forms
   * @responseBody 200 - { requiredFields: string[] }
   * @responseBody 404 - { "message": "Form not found", "name": "Exception", "status": 404 }
   */
  public async requiredFields({ params, response }: HttpContext) {
    const formId = +params.id;

    const form = await Form.query()
      .where("id", formId)
      .preload("attributes", async (query) => {
        await query.pivotColumns(["is_required"]);
      })
      .firstOrFail();

    const requiredFields = form.attributes
      .filter((attribute) => attribute.$extras.pivot_is_required === true)
      .map((attribute) => ({
        id: attribute.id,
        name: attribute.name,
      }));

    return response.json({ requiredFields });
  }
}
