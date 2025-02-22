import type { HttpContext } from "@adonisjs/core/http";

import Event from "#models/event";
import Form from "#models/form";
import { createFormValidator, updateFormValidator } from "#validators/form";

export default class FormsController {
  /**
   * @index
   * @operationId getForms
   * @description Returns an array of event forms
   * @tag forms
   * @responseBody 200 - <Form[]>
   */
  public async index({ params, request, bouncer }: HttpContext) {
    const eventId = Number(params.eventId);
    await bouncer.authorize("manage_form", await Event.findOrFail(eventId));
    const page = Number(request.input("page", 1));
    const perPage = Number(request.input("perPage", 10));

    return await Form.query()
      .where("event_id", eventId)
      .paginate(page, perPage);
  }

  /**
   * @store
   * @operationId createForm
   * @description Creates a form for the specified event
   * @tag forms
   * @requestBody <createFormValidator>
   * @returnBody 201 - <Form>
   */
  public async store({ params, request, bouncer }: HttpContext) {
    const eventId = Number(params.eventId);

    await bouncer.authorize("manage_form", await Event.findOrFail(eventId));

    const { attributesIds, ...newFormData } =
      await request.validateUsing(createFormValidator);

    const form = await Form.create({ ...newFormData, eventId });

    await form.related("attributes").attach(attributesIds);

    return form;
  }

  /**
   * @show
   * @operationId getForm
   * @description Returns a form
   * @tag forms
   * @responseBody 200 - <Form>
   * @responseBody 404 - { message: "Row not found", "name": "Exception", status: 404},
   */
  public async show({ params, bouncer }: HttpContext) {
    const eventId = Number(params.eventId);
    const formId = Number(params.id);
    await bouncer.authorize("manage_form", await Event.findOrFail(eventId));

    return await Form.query()
      .where("event_id", eventId)
      .where("id", formId)
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

    const form = await Form.query()
      .where("event_id", eventId)
      .where("id", formId)
      .firstOrFail();

    await form.delete();

    return response.noContent();
  }
}
