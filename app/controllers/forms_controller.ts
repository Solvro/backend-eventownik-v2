import string from "@adonisjs/core/helpers/string";
import type { HttpContext } from "@adonisjs/core/http";

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
  public async index({ params, request }: HttpContext) {
    const eventId = Number(params.eventId);
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
  public async store({ params, request }: HttpContext) {
    const eventId = Number(params.eventId);
    const data = await createFormValidator.validate(request.all());
    const form = new Form();

    form.merge({
      ...data,
      eventId,
    });

    if (form.name && form.id) {
      form.slug = string.slug(`${form.name}${form.id}`, {
        lower: true,
        strict: true,
      });
    }

    await form.save();

    //waiting for attributes implementation
    // const attributeIds = data.attributeIds ?? [];

    // if (attributeIds.length > 0) {
    //   await form.related("attributes").sync(attributeIds);
    // }

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
  public async show({ params }: HttpContext) {
    const eventId = Number(params.eventId);
    const formId = Number(params.id);

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
   * @tag forms
   * @requestBody <updateFormValidator>
   * @responseBody 200 - <Form>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  public async update({ params, request }: HttpContext) {
    const eventId = Number(params.eventId);
    const formId = Number(params.id);

    const form = await Form.query()
      .where("event_id", eventId)
      .where("id", formId)
      .firstOrFail();

    const data = await updateFormValidator.validate(request.all());
    form.merge(data);

    await form.save();

    // waiting for attributes implementation
    // const attributeIds = data.attributeIds ?? [];
    // await form.related("attributes").sync(attributeIds);

    return form;
  }

  /**
   * @destroy
   * @operationId deleteForm
   * @description Deletes a form
   * @tag forms
   * @responseBody 204 - {}
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  public async destroy({ params, response }: HttpContext) {
    const eventId = Number(params.eventId);
    const formId = Number(params.id);

    const form = await Form.query()
      .where("event_id", eventId)
      .where("id", formId)
      .firstOrFail();

    await form.delete();

    return response.noContent();
  }
}
