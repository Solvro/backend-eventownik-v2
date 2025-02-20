import string from "@adonisjs/core/helpers/string";
import type { HttpContext } from "@adonisjs/core/http";

import Form from "#models/form";
import { createFormValidator, updateFormValidator } from "#validators/form";

export default class FormsController {
  public async index({ params, request }: HttpContext) {
    const eventId = Number(params.eventId);
    const page = Number(request.input("page", 1));
    const perPage = Number(request.input("perPage", 10));

    return await Form.query()
      .where("event_id", eventId)
      .paginate(page, perPage);
  }

  public async store({ params, request, response }: HttpContext) {
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

    const attributeIds = data.attributeIds ?? [];

    if (attributeIds.length > 0) {
      await form.related("attributes").sync(attributeIds);
    }

    return response.created({
      message: "Form created successfully",
      form,
    });
  }

  public async show({ params }: HttpContext) {
    const eventId = Number(params.eventId);
    const formId = Number(params.id);

    return await Form.query()
      .where("event_id", eventId)
      .where("id", formId)
      .preload("attributes")
      .firstOrFail();
  }

  public async update({ params, request, response }: HttpContext) {
    const eventId = Number(params.eventId);
    const formId = Number(params.id);

    const form = await Form.query()
      .where("event_id", eventId)
      .where("id", formId)
      .firstOrFail();

    const data = await updateFormValidator.validate(request.all());
    form.merge(data);
    await form.save();

    const attributeIds = data.attributeIds ?? [];
    await form.related("attributes").sync(attributeIds);

    return response.ok({ message: "Form updated successfully", form });
  }

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
