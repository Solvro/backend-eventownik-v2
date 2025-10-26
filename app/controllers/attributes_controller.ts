import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

import Event from "#models/event";
import { AttributeService } from "#services/attribute_service";
import {
  createAttributeValidator,
  updateAttributeValidator,
} from "#validators/attribute";

@inject()
export default class AttributesController {
  // eslint-disable-next-line no-useless-constructor
  constructor(private attributeService: AttributeService) {}

  /**
   * @index
   * @operationId getEventAttributes
   * @description Returns an array of attributes of a specified event
   * @tag attributes
   * @responseBody 200 - <Attribute[]>
   */
  async index({ params, bouncer }: HttpContext) {
    const eventUuid = params.eventUuid as string;

    await bouncer.authorize("manage_event", await Event.findOrFail(eventUuid));

    const attributes =
      await this.attributeService.getEventAttributes(eventUuid);

    return attributes;
  }

  /**
   * @store
   * @operationId addEventAttribute
   * @description Adds an attribute to an event
   * @tag attributes
   * @requestBody <createAttributeValidator>
   * @responseBody 201 - <Attribute>
   */
  async store({ params, request, bouncer }: HttpContext) {
    const eventUuid = params.eventUuid as string;

    await bouncer.authorize(
      "manage_setting",
      await Event.findOrFail(eventUuid),
    );

    const newAttributeData = await request.validateUsing(
      createAttributeValidator,
      { meta: { eventUuid } },
    );

    const newAttribute = await this.attributeService.createAttribute({
      eventUuid,
      ...newAttributeData,
    });

    return newAttribute;
  }

  /**
   * @show
   * @operationId getEventAttribute
   * @description Returns event attribute details
   * @tag attributes
   * @responseBody 200 - <Attribute>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  async show({ params, bouncer }: HttpContext) {
    const eventUuid = params.eventUuid as string;
    const attributeUuid = params.uuid as string;

    await bouncer.authorize("manage_event", await Event.findOrFail(eventUuid));

    const attribute = await this.attributeService.getEventAttribute(
      eventUuid,
      attributeUuid,
    );

    return attribute;
  }

  /**
   * @update
   * @operationId updateEventAttribute
   * @description Update event attribute details
   * @tag attributes
   * @requestBody <updateAttributeValidator>
   * @responseBody 200 - <Attribute>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  async update({ params, request, bouncer }: HttpContext) {
    const eventUuid = params.eventUuid as string;
    const attributeUuid = params.uuid as string;

    await bouncer.authorize(
      "manage_setting",
      await Event.findOrFail(eventUuid),
    );

    const updates = await request.validateUsing(updateAttributeValidator, {
      meta: { eventUuid, attributeUuid },
    });

    const updatedAttribute = this.attributeService.updateAttribute(
      eventUuid,
      attributeUuid,
      updates,
    );

    return updatedAttribute;
  }

  /**
   * @destroy
   * @operationId deleteEventAttribute
   * @description Deletes an attribute of an event
   * @tag attributes
   * @responseBody 204 - {}
   */
  async destroy({ params, response, bouncer }: HttpContext) {
    const eventUuid = params.eventUuid as string;
    const attributeUuid = params.uuid as string;

    await bouncer.authorize(
      "manage_setting",
      await Event.findOrFail(eventUuid),
    );

    await this.attributeService.deleteAttribute(eventUuid, attributeUuid);

    return response.noContent();
  }
}
